from typing import List, Optional, Set, Dict, Any
import asyncio
from datetime import datetime, timedelta
import json
from redis.asyncio import Redis
from fastapi import Depends
from app.core.config import settings
from app.core.cache import Cache

class CacheManager:
    def __init__(self, redis_url: str):
        self.cache = Cache(redis_url)
        self.redis = Redis.from_url(redis_url, encoding="utf-8")
        self.pubsub = self.redis.pubsub()
        
        # Cache key patterns
        self.patterns = {
            'resume': {
                'embedding': 'resume:{resume_id}:embedding',
                'analysis': 'resume:{resume_id}:analysis',
                'matches': 'resume:{resume_id}:matches:*'
            },
            'job': {
                'embedding': 'job:{job_id}:embedding',
                'analysis': 'job:{job_id}:analysis',
                'matches': 'job:{job_id}:matches:*'
            },
            'match': {
                'score': 'match:{resume_id}:{job_id}:score',
                'analysis': 'match:{resume_id}:{job_id}:analysis'
            }
        }
        
        # Cache dependencies
        self.dependencies = {
            'resume': {
                'embedding': ['analysis', 'matches'],
                'analysis': ['matches']
            },
            'job': {
                'embedding': ['analysis', 'matches'],
                'analysis': ['matches']
            }
        }
        
        # TTLs (in seconds)
        self.ttls = {
            'resume_embedding': 86400,  # 24 hours
            'job_embedding': 86400,     # 24 hours
            'match_score': 3600,        # 1 hour
            'analysis': 1800,           # 30 minutes
            'matches': 1800             # 30 minutes
        }
        
        # Start pubsub listener
        asyncio.create_task(self._listen_for_invalidations())
    
    async def _listen_for_invalidations(self):
        """Listen for cache invalidation events."""
        await self.pubsub.subscribe('cache_invalidation')
        
        while True:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True)
                if message and message['type'] == 'message':
                    data = json.loads(message['data'])
                    await self._handle_invalidation_event(data)
            except Exception as e:
                print(f"Error in cache invalidation listener: {e}")
                await asyncio.sleep(1)
    
    async def _handle_invalidation_event(self, data: Dict[str, Any]):
        """Handle cache invalidation event."""
        entity_type = data.get('type')
        entity_id = data.get('id')
        affected_keys = data.get('affected_keys', [])
        
        if not entity_type or not entity_id:
            return
        
        # Clear affected keys
        for key in affected_keys:
            await self.cache.delete(key)
        
        # Clear dependent keys
        await self._clear_dependent_keys(entity_type, entity_id)
    
    async def _clear_dependent_keys(self, entity_type: str, entity_id: str):
        """Clear keys that depend on the invalidated entity."""
        if entity_type not in self.dependencies:
            return
        
        deps = self.dependencies[entity_type]
        patterns = self.patterns[entity_type]
        
        for key_type, dependent_types in deps.items():
            # Get the base key
            base_key = patterns[key_type].format(**{f"{entity_type}_id": entity_id})
            
            # Clear dependent keys
            for dep_type in dependent_types:
                pattern = patterns[dep_type].format(**{f"{entity_type}_id": entity_id})
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
    
    async def invalidate_resume(self, resume_id: str, reason: str = "update"):
        """Invalidate all cache entries for a resume."""
        affected_keys = []
        
        # Collect affected keys
        for key_type, pattern in self.patterns['resume'].items():
            key = pattern.format(resume_id=resume_id)
            affected_keys.append(key)
        
        # Publish invalidation event
        await self.redis.publish(
            'cache_invalidation',
            json.dumps({
                'type': 'resume',
                'id': resume_id,
                'reason': reason,
                'affected_keys': affected_keys,
                'timestamp': datetime.utcnow().isoformat()
            })
        )
        
        # Clear dependent keys
        await self._clear_dependent_keys('resume', resume_id)
    
    async def invalidate_job(self, job_id: str, reason: str = "update"):
        """Invalidate all cache entries for a job."""
        affected_keys = []
        
        # Collect affected keys
        for key_type, pattern in self.patterns['job'].items():
            key = pattern.format(job_id=job_id)
            affected_keys.append(key)
        
        # Publish invalidation event
        await self.redis.publish(
            'cache_invalidation',
            json.dumps({
                'type': 'job',
                'id': job_id,
                'reason': reason,
                'affected_keys': affected_keys,
                'timestamp': datetime.utcnow().isoformat()
            })
        )
        
        # Clear dependent keys
        await self._clear_dependent_keys('job', job_id)
    
    async def invalidate_match(self, resume_id: str, job_id: str, reason: str = "update"):
        """Invalidate cache entries for a specific resume-job match."""
        affected_keys = []
        
        # Collect affected keys
        for key_type, pattern in self.patterns['match'].items():
            key = pattern.format(resume_id=resume_id, job_id=job_id)
            affected_keys.append(key)
        
        # Publish invalidation event
        await self.redis.publish(
            'cache_invalidation',
            json.dumps({
                'type': 'match',
                'resume_id': resume_id,
                'job_id': job_id,
                'reason': reason,
                'affected_keys': affected_keys,
                'timestamp': datetime.utcnow().isoformat()
            })
        )
    
    async def get_cached_value(
        self,
        key: str,
        ttl: Optional[int] = None,
        binary: bool = False
    ) -> Optional[Any]:
        """Get value from cache with TTL."""
        value = await self.cache.get(key, binary)
        
        if value is not None and ttl:
            # Check if value is expired
            metadata_key = f"{key}:metadata"
            metadata = await self.redis.get(metadata_key)
            
            if metadata:
                metadata = json.loads(metadata)
                created_at = datetime.fromisoformat(metadata['created_at'])
                
                if datetime.utcnow() - created_at > timedelta(seconds=ttl):
                    # Value is expired, delete it
                    await self.cache.delete(key)
                    await self.redis.delete(metadata_key)
                    return None
        
        return value
    
    async def set_cached_value(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        binary: bool = False
    ) -> bool:
        """Set value in cache with TTL and metadata."""
        success = await self.cache.set(key, value, ttl, binary)
        
        if success and ttl:
            # Store metadata
            metadata = {
                'created_at': datetime.utcnow().isoformat(),
                'ttl': ttl
            }
            metadata_key = f"{key}:metadata"
            await self.redis.set(
                metadata_key,
                json.dumps(metadata),
                ex=ttl
            )
        
        return success
    
    async def get_or_set(
        self,
        key: str,
        getter_func,
        ttl: Optional[int] = None,
        binary: bool = False
    ) -> Any:
        """Get value from cache or set it using getter function."""
        value = await self.get_cached_value(key, ttl, binary)
        
        if value is None:
            value = await getter_func()
            if value is not None:
                await self.set_cached_value(key, value, ttl, binary)
        
        return value
    
    async def clear_expired(self):
        """Clear expired cache entries."""
        # Get all keys with metadata
        metadata_keys = await self.redis.keys('*:metadata')
        
        for metadata_key in metadata_keys:
            metadata = await self.redis.get(metadata_key)
            if metadata:
                metadata = json.loads(metadata)
                created_at = datetime.fromisoformat(metadata['created_at'])
                ttl = metadata['ttl']
                
                if datetime.utcnow() - created_at > timedelta(seconds=ttl):
                    # Extract the actual key
                    key = metadata_key.replace(':metadata', '')
                    
                    # Delete both the value and metadata
                    await self.redis.delete(key, metadata_key)

# Dependency
async def get_cache_manager() -> CacheManager:
    """Get cache manager instance."""
    manager = CacheManager(settings.REDIS_URL)
    try:
        yield manager
    finally:
        await manager.redis.close()
        await manager.pubsub.close() 