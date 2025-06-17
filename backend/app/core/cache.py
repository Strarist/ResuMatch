from typing import Any, Optional, Union
import json
import pickle
from datetime import timedelta
from redis.asyncio import Redis
from fastapi import Depends
from app.core.config import settings

class Cache:
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        self.redis_binary = Redis.from_url(redis_url, encoding=None)  # For binary data
        
        # Cache key prefixes
        self.prefixes = {
            'resume': 'resume',
            'job': 'job',
            'match': 'match',
            'embedding': 'embedding',
            'role': 'role',
            'skill': 'skill'
        }
        
        # Default TTLs (in seconds)
        self.ttls = {
            'resume_embedding': 86400,  # 24 hours
            'job_embedding': 86400,     # 24 hours
            'match_score': 3600,        # 1 hour
            'role_variations': 86400,   # 24 hours
            'skill_embeddings': 86400,  # 24 hours
            'analysis_result': 1800     # 30 minutes
        }

    def _get_key(self, prefix: str, *parts: str) -> str:
        """Generate a cache key from prefix and parts."""
        return f"{self.prefixes[prefix]}:{':'.join(str(p) for p in parts)}"

    async def get(self, key: str, binary: bool = False) -> Optional[Any]:
        """Get value from cache."""
        redis = self.redis_binary if binary else self.redis
        value = await redis.get(key)
        
        if value is None:
            return None
            
        if binary:
            return pickle.loads(value)
            
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value

    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None,
        binary: bool = False
    ) -> bool:
        """Set value in cache with optional expiration."""
        redis = self.redis_binary if binary else self.redis
        
        if binary:
            value = pickle.dumps(value)
        elif not isinstance(value, (str, int, float, bool)):
            value = json.dumps(value)
            
        return await redis.set(key, value, ex=expire)

    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        return await self.redis.delete(key) > 0

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        return await self.redis.exists(key) > 0

    # Resume-specific methods
    async def get_resume_embedding(self, resume_id: str) -> Optional[bytes]:
        """Get resume embedding from cache."""
        key = self._get_key('resume', resume_id, 'embedding')
        return await self.get(key, binary=True)

    async def set_resume_embedding(
        self,
        resume_id: str,
        embedding: bytes
    ) -> bool:
        """Cache resume embedding."""
        key = self._get_key('resume', resume_id, 'embedding')
        return await self.set(
            key,
            embedding,
            expire=self.ttls['resume_embedding'],
            binary=True
        )

    # Job-specific methods
    async def get_job_embedding(self, job_id: str) -> Optional[bytes]:
        """Get job embedding from cache."""
        key = self._get_key('job', job_id, 'embedding')
        return await self.get(key, binary=True)

    async def set_job_embedding(
        self,
        job_id: str,
        embedding: bytes
    ) -> bool:
        """Cache job embedding."""
        key = self._get_key('job', job_id, 'embedding')
        return await self.set(
            key,
            embedding,
            expire=self.ttls['job_embedding'],
            binary=True
        )

    # Match-specific methods
    async def get_match_score(
        self,
        resume_id: str,
        job_id: str
    ) -> Optional[dict]:
        """Get match score from cache."""
        key = self._get_key('match', resume_id, job_id, 'score')
        return await self.get(key)

    async def set_match_score(
        self,
        resume_id: str,
        job_id: str,
        score: dict
    ) -> bool:
        """Cache match score."""
        key = self._get_key('match', resume_id, job_id, 'score')
        return await self.set(
            key,
            score,
            expire=self.ttls['match_score']
        )

    # Role-specific methods
    async def get_role_variations(self, title: str) -> Optional[list]:
        """Get role title variations from cache."""
        key = self._get_key('role', title.lower(), 'variations')
        return await self.get(key)

    async def set_role_variations(
        self,
        title: str,
        variations: list
    ) -> bool:
        """Cache role title variations."""
        key = self._get_key('role', title.lower(), 'variations')
        return await self.set(
            key,
            variations,
            expire=self.ttls['role_variations']
        )

    # Skill-specific methods
    async def get_skill_embedding(self, skill: str) -> Optional[bytes]:
        """Get skill embedding from cache."""
        key = self._get_key('skill', skill.lower(), 'embedding')
        return await self.get(key, binary=True)

    async def set_skill_embedding(
        self,
        skill: str,
        embedding: bytes
    ) -> bool:
        """Cache skill embedding."""
        key = self._get_key('skill', skill.lower(), 'embedding')
        return await self.set(
            key,
            embedding,
            expire=self.ttls['skill_embeddings'],
            binary=True
        )

    # Analysis result methods
    async def get_analysis_result(
        self,
        resume_id: str,
        job_id: str
    ) -> Optional[dict]:
        """Get analysis result from cache."""
        key = self._get_key('match', resume_id, job_id, 'analysis')
        return await self.get(key)

    async def set_analysis_result(
        self,
        resume_id: str,
        job_id: str,
        result: dict
    ) -> bool:
        """Cache analysis result."""
        key = self._get_key('match', resume_id, job_id, 'analysis')
        return await self.set(
            key,
            result,
            expire=self.ttls['analysis_result']
        )

    # Batch operations
    async def mget(self, keys: list[str], binary: bool = False) -> list[Optional[Any]]:
        """Get multiple values from cache."""
        redis = self.redis_binary if binary else self.redis
        values = await redis.mget(keys)
        
        if binary:
            return [pickle.loads(v) if v else None for v in values]
            
        return [
            json.loads(v) if v and not isinstance(v, (str, int, float, bool)) else v
            for v in values
        ]

    async def mset(
        self,
        mapping: dict[str, Any],
        expire: Optional[int] = None,
        binary: bool = False
    ) -> bool:
        """Set multiple values in cache."""
        redis = self.redis_binary if binary else self.redis
        
        if binary:
            mapping = {k: pickle.dumps(v) for k, v in mapping.items()}
        else:
            mapping = {
                k: json.dumps(v) if not isinstance(v, (str, int, float, bool)) else v
                for k, v in mapping.items()
            }
            
        pipeline = redis.pipeline()
        for key, value in mapping.items():
            pipeline.set(key, value, ex=expire)
            
        results = await pipeline.execute()
        return all(results)

    # Cache cleanup
    async def clear_resume_cache(self, resume_id: str) -> bool:
        """Clear all cache entries for a resume."""
        pattern = self._get_key('resume', resume_id, '*')
        keys = await self.redis.keys(pattern)
        if keys:
            return await self.redis.delete(*keys) > 0
        return True

    async def clear_job_cache(self, job_id: str) -> bool:
        """Clear all cache entries for a job."""
        pattern = self._get_key('job', job_id, '*')
        keys = await self.redis.keys(pattern)
        if keys:
            return await self.redis.delete(*keys) > 0
        return True

    async def clear_match_cache(self, resume_id: str, job_id: str) -> bool:
        """Clear all cache entries for a resume-job match."""
        pattern = self._get_key('match', resume_id, job_id, '*')
        keys = await self.redis.keys(pattern)
        if keys:
            return await self.redis.delete(*keys) > 0
        return True

# Dependency
async def get_cache() -> Cache:
    """Get cache instance."""
    cache = Cache(settings.REDIS_URL)
    try:
        yield cache
    finally:
        await cache.redis.close()
        await cache.redis_binary.close() 