import { RoadmapNode, OpportunityMatch, RecruiterSignalProfile } from '../context/LivingSystemContext';

// Extend the original interfaces with new hardened properties for UI display
export interface HardenedRoadmapNode extends RoadmapNode {
  dependencies: string[];
  completionConfidence: number; // 0 - 100
  projectedImpact: string;
  strategicRationale: string;
}

export interface HardenedOpportunityMatch extends OpportunityMatch {
  compensation: string;
  recruiterPressure: 'high' | 'medium' | 'low';
  hiringWindow: string; // e.g. "Closes in 6 days", "Urgent hire"
  stackCompatibility: string;
  alignmentReasoning: string;
}

export interface PersonaProfile {
  id: string;
  name: string; // e.g. "Full Stack Engineer"
  specialization: string;
  targetRole: string;
  strongestSkills: string[];
  weakestSkills: string[];
  metrics: {
    matchScore: number;
    careerVelocity: number;
    marketFit: number;
    recruiterConfidence: number;
  };
  metricsHistory: {
    matchScore: number[];
    careerVelocity: number[];
    marketFit: number[];
    recruiterConfidence: number[];
  };
  roadmap: HardenedRoadmapNode[];
  opportunities: HardenedOpportunityMatch[];
  recruiterProfile: RecruiterSignalProfile;
  marketIntel: {
    title: string;
    description: string;
    salaryRange: string;
    growthRate: string;
    demandTrend: 'up' | 'stable' | 'down';
    demandChangePercent: number;
  };
}

export const baselinePersonas: PersonaProfile[] = [
  {
    id: 'full-stack',
    name: 'Full Stack Engineer',
    specialization: 'React & Node Ecosystems',
    targetRole: 'Staff Full Stack Engineer',
    strongestSkills: ['TypeScript', 'React/Next.js', 'Node.js', 'TailwindCSS'],
    weakestSkills: ['GraphQL Federation', 'Distributed Caching (Redis)', 'CI/CD Performance Tuning'],
    metrics: {
      matchScore: 92.5,
      careerVelocity: 81.0,
      marketFit: 89.0,
      recruiterConfidence: 85.0
    },
    metricsHistory: {
      matchScore: [89.0, 89.5, 90.0, 90.4, 91.0, 91.5, 91.8, 92.0, 92.2, 92.5],
      careerVelocity: [72.0, 74.0, 75.5, 77.0, 78.0, 79.2, 79.8, 80.2, 80.5, 81.0],
      marketFit: [85.0, 85.5, 86.0, 86.8, 87.2, 87.9, 88.2, 88.5, 88.8, 89.0],
      recruiterConfidence: [79.0, 80.0, 81.2, 82.0, 82.5, 83.4, 84.0, 84.5, 84.8, 85.0]
    },
    roadmap: [
      {
        skill: 'GraphQL Federation',
        priority: 'high',
        effortWeeks: 4,
        impactEstimate: 92,
        reason: 'Essential for modern micro-frontend queries and schema stitched APIs.',
        status: 'active',
        dependencies: ['TypeScript core'],
        completionConfidence: 85,
        projectedImpact: 'Bridging front-to-back schema definition mismatch.',
        strategicRationale: 'Apollo GraphQL adoption has increased +14% among target tier-1 organizations.'
      },
      {
        skill: 'Distributed Caching (Redis)',
        priority: 'high',
        effortWeeks: 5,
        impactEstimate: 88,
        reason: 'Improves SSR rendering load and minimizes database connection bottlenecks.',
        status: 'active',
        dependencies: ['Node.js database connections'],
        completionConfidence: 90,
        projectedImpact: 'Reduces Next.js hydration and TTFB metrics by up to 45%.',
        strategicRationale: 'Crucial scaling milestone for enterprise e-commerce and SaaS layouts.'
      },
      {
        skill: 'CI/CD Performance Tuning',
        priority: 'medium',
        effortWeeks: 3,
        impactEstimate: 80,
        reason: 'Optimizes bundle sizing and lint/test cycles to drive deployment speed.',
        status: 'active',
        dependencies: [],
        completionConfidence: 75,
        projectedImpact: 'Reduces build times from 12m to less than 3m.',
        strategicRationale: 'Directly improves career velocity score by establishing operational efficiency.'
      }
    ],
    opportunities: [
      {
        title: 'Staff Full Stack Developer',
        company: 'Vercel',
        alignmentScore: 0.94,
        confidence: 0.91,
        urgency: 'high',
        type: 'Full-time / Remote',
        missingRequirements: ['GraphQL Federation'],
        proofGaps: ['Production deployment of federated query router'],
        compensation: '$190k - $240k + Equity',
        recruiterPressure: 'high',
        hiringWindow: 'Closes in 4 days',
        stackCompatibility: 'React, Next.js, TypeScript, TailwindCSS, GraphQL',
        alignmentReasoning: 'Perfect frontend stack alignment. Bridging the GraphQL gap unlocks interview pre-screening bypass.'
      },
      {
        title: 'Senior Frontend Architect',
        company: 'Linear',
        alignmentScore: 0.90,
        confidence: 0.88,
        urgency: 'medium',
        type: 'Full-time / Hybrid SF',
        missingRequirements: ['Distributed Caching (Redis)'],
        proofGaps: ['Real-time sync protocol optimization benchmarks'],
        compensation: '$180k - $220k',
        recruiterPressure: 'medium',
        hiringWindow: 'Closes in 12 days',
        stackCompatibility: 'React, Node, Redis, PostgreSQL, WebSockets',
        alignmentReasoning: 'Strong fit for performance-oriented React engineering. Requires redis proof validation.'
      }
    ],
    recruiterProfile: {
      hiringConfidence: 0.91,
      productionReadiness: 0.88,
      technicalDepth: 0.85,
      specializationStrength: 0.92,
      differentiationScore: 0.89,
      portfolioMaturity: 'production_mature',
      strongestSignals: [
        'Advanced state synchronization patterns validated',
        'Expert-level Next.js rendering lifecycle understanding',
        'Strong component-driven system modularization'
      ],
      hiringRisks: [
        'Lack of documented schema-stitching production deployments',
        'Minimal cloud performance monitoring proof'
      ],
      roleFit: [
        { role: 'Staff Full Stack Developer', skillReadiness: 0.93, proofAdjusted: 0.90, missing: ['GraphQL Federation'] },
        { role: 'Senior Frontend Architect', skillReadiness: 0.89, proofAdjusted: 0.86, missing: ['Redis'] }
      ]
    },
    marketIntel: {
      title: 'Full Stack Engineering',
      description: 'Demand spikes in responsive Next.js Server Components and backend integration.',
      salaryRange: '$160k - $230k',
      growthRate: 'Steady (+12% YoY)',
      demandTrend: 'up',
      demandChangePercent: 12
    }
  },
  {
    id: 'cloud-infra',
    name: 'Cloud Engineer',
    specialization: 'Kubernetes & AWS Platform',
    targetRole: 'Senior Cloud Infrastructure Engineer',
    strongestSkills: ['Terraform', 'AWS Core', 'Kubernetes', 'Docker'],
    weakestSkills: ['Prometheus/Grafana Tuning', 'Istio Service Mesh', 'Go Core Development'],
    metrics: {
      matchScore: 90.1,
      careerVelocity: 79.5,
      marketFit: 93.0,
      recruiterConfidence: 87.0
    },
    metricsHistory: {
      matchScore: [87.0, 87.5, 88.0, 88.4, 88.9, 89.2, 89.5, 89.8, 90.0, 90.1],
      careerVelocity: [70.0, 71.5, 73.0, 74.2, 75.8, 77.0, 78.0, 78.5, 79.0, 79.5],
      marketFit: [90.0, 90.5, 91.0, 91.5, 91.8, 92.2, 92.5, 92.8, 92.9, 93.0],
      recruiterConfidence: [81.0, 82.0, 83.2, 84.0, 84.5, 85.3, 85.9, 86.2, 86.8, 87.0]
    },
    roadmap: [
      {
        skill: 'Istio Service Mesh',
        priority: 'high',
        effortWeeks: 6,
        impactEstimate: 91,
        reason: 'Necessary for advanced mTLS, traffic splitting, and distributed observability.',
        status: 'active',
        dependencies: ['Kubernetes networking'],
        completionConfidence: 80,
        projectedImpact: 'Improves platform security matrix and dynamic canary routing accuracy.',
        strategicRationale: 'Istio demand elevated due to increased platform engineering standard updates (+18% market shift).'
      },
      {
        skill: 'Prometheus/Grafana Tuning',
        priority: 'medium',
        effortWeeks: 3,
        impactEstimate: 83,
        reason: 'Optimizes memory footprint of scraper metrics and cleans alert thresholds.',
        status: 'active',
        dependencies: ['Containers'],
        completionConfidence: 88,
        projectedImpact: 'Prevents OOM cluster crashes and cuts cloud monitoring costs by 30%.',
        strategicRationale: 'Recruiters flag missing monitoring parameters as a primary mid-level bottleneck.'
      },
      {
        skill: 'Go Core Development',
        priority: 'low',
        effortWeeks: 5,
        impactEstimate: 76,
        reason: 'Enables custom Kubernetes operators and Terraform provider edits.',
        status: 'active',
        dependencies: [],
        completionConfidence: 70,
        projectedImpact: 'Unlocks customization of cloud-native scheduler controllers.',
        strategicRationale: 'Core Go competencies differentiate platform builders from YAML writers.'
      }
    ],
    opportunities: [
      {
        title: 'Senior Site Reliability Engineer',
        company: 'Stripe',
        alignmentScore: 0.92,
        confidence: 0.89,
        urgency: 'high',
        type: 'Hybrid / SF',
        missingRequirements: ['Istio Service Mesh'],
        proofGaps: ['Zero-downtime microservice migration traffic rule config'],
        compensation: '$200k - $250k',
        recruiterPressure: 'high',
        hiringWindow: 'Closes in 5 days',
        stackCompatibility: 'AWS, Terraform, Kubernetes, Istio, Go',
        alignmentReasoning: 'Excellent cloud tooling alignment. Bridging the Istio mesh gap triggers instant interview routing.'
      },
      {
        title: 'Platform Infrastructure Lead',
        company: 'HashiCorp',
        alignmentScore: 0.88,
        confidence: 0.86,
        urgency: 'medium',
        type: 'Remote',
        missingRequirements: ['Go Core Development'],
        proofGaps: ['Terraform custom provider plugin github repository proof'],
        compensation: '$185k - $235k',
        recruiterPressure: 'medium',
        hiringWindow: 'Closes in 9 days',
        stackCompatibility: 'Terraform, Go, AWS, Consul, Vault',
        alignmentReasoning: 'Directly leverages deep infrastructure automation skill. Go development is the core gap.'
      }
    ],
    recruiterProfile: {
      hiringConfidence: 0.88,
      productionReadiness: 0.93,
      technicalDepth: 0.91,
      specializationStrength: 0.94,
      differentiationScore: 0.87,
      portfolioMaturity: 'production_mature',
      strongestSignals: [
        'Demonstrated automated multi-region disaster recovery templates',
        'Expert-level multi-stage Docker optimization',
        'Sophisticated Terraform structural layouts'
      ],
      hiringRisks: [
        'Lack of service mesh validation in enterprise scale',
        'No custom Operator framework design artifacts'
      ],
      roleFit: [
        { role: 'Senior Site Reliability Engineer', skillReadiness: 0.91, proofAdjusted: 0.88, missing: ['Istio Service Mesh'] },
        { role: 'Platform Infrastructure Lead', skillReadiness: 0.86, proofAdjusted: 0.83, missing: ['Go Core Development'] }
      ]
    },
    marketIntel: {
      title: 'Cloud Infrastructure',
      description: 'Intense industry focus on platform engineering, container scheduling, and cost reduction.',
      salaryRange: '$170k - $260k',
      growthRate: 'Surging (+18% YoY)',
      demandTrend: 'up',
      demandChangePercent: 18
    }
  },
  {
    id: 'backend',
    name: 'Backend Engineer',
    specialization: 'Python & Distributed Systems',
    targetRole: 'Senior Core Backend Engineer',
    strongestSkills: ['Python', 'PostgreSQL', 'FastAPI', 'Redis'],
    weakestSkills: ['Distributed Transactions (Sagas/2PC)', 'System Architecture Modeling', 'NoSQL scaling (Cassandra)'],
    metrics: {
      matchScore: 88.4,
      careerVelocity: 75.0,
      marketFit: 85.0,
      recruiterConfidence: 81.0
    },
    metricsHistory: {
      matchScore: [85.0, 85.5, 86.0, 86.5, 87.0, 87.3, 87.8, 88.0, 88.2, 88.4],
      careerVelocity: [68.0, 69.2, 70.5, 71.0, 72.3, 73.0, 73.8, 74.2, 74.8, 75.0],
      marketFit: [81.0, 81.5, 82.2, 82.9, 83.5, 84.0, 84.3, 84.6, 84.8, 85.0],
      recruiterConfidence: [75.0, 76.2, 77.0, 77.8, 78.4, 79.1, 79.5, 80.2, 80.6, 81.0]
    },
    roadmap: [
      {
        skill: 'Distributed Transactions (Sagas/2PC)',
        priority: 'high',
        effortWeeks: 7,
        impactEstimate: 90,
        reason: 'Guarantees eventual consistency across decoupled payment and user ledger schemas.',
        status: 'active',
        dependencies: ['Redis', 'PostgreSQL transaction structures'],
        completionConfidence: 75,
        projectedImpact: 'Reduces database race conditions and double-spending transactions.',
        strategicRationale: 'Highly demanded by fintech and commerce systems looking for strict transactional integrity.'
      },
      {
        skill: 'NoSQL scaling (Cassandra)',
        priority: 'medium',
        effortWeeks: 5,
        impactEstimate: 84,
        reason: 'Handles high-volume time-series analytical tracking without DB deadlock spikes.',
        status: 'active',
        dependencies: [],
        completionConfidence: 82,
        projectedImpact: 'Enables real-time tracking of tens of millions of analytical telemetry items.',
        strategicRationale: 'Required for high-throughput messaging or telemetry aggregations.'
      },
      {
        skill: 'System Architecture Modeling',
        priority: 'low',
        effortWeeks: 4,
        impactEstimate: 78,
        reason: 'Deepens technical documentation and systemic sequence proof diagrams.',
        status: 'active',
        dependencies: [],
        completionConfidence: 90,
        projectedImpact: 'Slashes engineering alignment friction during system planning phases.',
        strategicRationale: 'Differentiates technical senior developers from pure implementations devs.'
      }
    ],
    opportunities: [
      {
        title: 'Distributed Infrastructure Lead',
        company: 'Stripe',
        alignmentScore: 0.90,
        confidence: 0.87,
        urgency: 'high',
        type: 'Full-time / Hybrid SF',
        missingRequirements: ['Distributed Transactions (Sagas/2PC)'],
        proofGaps: ['Production ledger design proof and write-path stress logs'],
        compensation: '$210k - $265k',
        recruiterPressure: 'high',
        hiringWindow: 'Closes in 3 days',
        stackCompatibility: 'Python, Redis, PostgreSQL, distributed transactions',
        alignmentReasoning: 'Perfect core language alignment. Reconciling transactional gap triggers priority screening.'
      },
      {
        title: 'Core Backend Architect',
        company: 'Linear',
        alignmentScore: 0.86,
        confidence: 0.83,
        urgency: 'medium',
        type: 'Remote',
        missingRequirements: ['NoSQL scaling (Cassandra)'],
        proofGaps: ['Time-series telemetry indexing performance charts'],
        compensation: '$175k - $215k',
        recruiterPressure: 'medium',
        hiringWindow: 'Closes in 15 days',
        stackCompatibility: 'Node, Python, Postgres, Redis, Cassandra',
        alignmentReasoning: 'Aligned with premium engineering cultures. Cassandra experience adds critical depth.'
      }
    ],
    recruiterProfile: {
      hiringConfidence: 0.83,
      productionReadiness: 0.89,
      technicalDepth: 0.87,
      specializationStrength: 0.86,
      differentiationScore: 0.84,
      portfolioMaturity: 'production_mature',
      strongestSignals: [
        'Robust REST/gRPC API response speed metrics',
        'Clean, scalable database schema migrations',
        'Complex SQL queries optimization proof'
      ],
      hiringRisks: [
        'Limited experience with global transaction coordination models',
        'No public proof of distributed NoSQL store maintenance'
      ],
      roleFit: [
        { role: 'Distributed Infrastructure Lead', skillReadiness: 0.88, proofAdjusted: 0.85, missing: ['Distributed Transactions'] },
        { role: 'Core Backend Architect', skillReadiness: 0.84, proofAdjusted: 0.81, missing: ['Cassandra'] }
      ]
    },
    marketIntel: {
      title: 'Backend Systems',
      description: 'Steady demand for performance-tuned relational backends and reliable microservices.',
      salaryRange: '$150k - $220k',
      growthRate: 'Steady (+9% YoY)',
      demandTrend: 'stable',
      demandChangePercent: 9
    }
  },
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    specialization: 'Large Models & GPU Infrastructure',
    targetRole: 'AI Platform Architect',
    strongestSkills: ['Python', 'PyTorch', 'Model Fine-tuning', 'Vector Databases'],
    weakestSkills: ['CUDA Kernel Optimization', 'LLM Serving Layer (vLLM/TensorRT)', 'Model Distillation'],
    metrics: {
      matchScore: 94.0,
      careerVelocity: 78.0,
      marketFit: 91.0,
      recruiterConfidence: 87.0
    },
    metricsHistory: {
      matchScore: [91.2, 91.8, 92.5, 92.9, 93.1, 93.4, 93.7, 93.9, 94.0, 94.0],
      careerVelocity: [65.0, 68.0, 70.2, 71.5, 73.0, 74.2, 75.8, 76.5, 77.2, 78.0],
      marketFit: [88.0, 88.5, 89.0, 89.2, 89.7, 90.1, 90.4, 90.8, 90.9, 91.0],
      recruiterConfidence: [81.0, 82.2, 83.5, 84.0, 84.8, 85.3, 86.0, 86.4, 86.8, 87.0]
    },
    roadmap: [
      {
        skill: 'CUDA Kernel Optimization',
        priority: 'high',
        effortWeeks: 6,
        impactEstimate: 95,
        reason: 'Critical gap for custom operations and GPU-accelerated computing workloads.',
        status: 'active',
        dependencies: ['C++ Systems Programming'],
        completionConfidence: 65,
        projectedImpact: 'Boosts training and inference speed by bypassed CUDA overhead.',
        strategicRationale: 'CUDA optimizations elevated due to extreme GPU computing shortages (+24% market shift).'
      },
      {
        skill: 'LLM Serving Layer (vLLM/TensorRT)',
        priority: 'high',
        effortWeeks: 4,
        impactEstimate: 90,
        reason: 'Enables high-performance low-latency orchestration of model runtime execution.',
        status: 'active',
        dependencies: ['Python model configurations'],
        completionConfidence: 85,
        projectedImpact: 'Reduces time-to-first-token by 60% and handles 4x concurrency density.',
        strategicRationale: 'Production rollouts of AI applications are bottlenecked by raw inference latency metrics.'
      },
      {
        skill: 'Model Distillation',
        priority: 'medium',
        effortWeeks: 4,
        impactEstimate: 82,
        reason: 'Shrinks models to lightweight student representations for cost-effective hosting.',
        status: 'active',
        dependencies: ['PyTorch model fine-tuning'],
        completionConfidence: 78,
        projectedImpact: 'Slashes API hosting costs by 75% while keeping 95% evaluation accuracy.',
        strategicRationale: 'Edge deployment and low-budget hosting are crucial skills in modern ML systems.'
      }
    ],
    opportunities: [
      {
        title: 'Principal AI Platform Architect',
        company: 'Vercel',
        alignmentScore: 0.95,
        confidence: 0.92,
        urgency: 'high',
        type: 'Full-time / Remote',
        missingRequirements: ['CUDA Kernel Optimization'],
        proofGaps: ['Demonstrated vLLM custom routing at scale'],
        compensation: '$210k - $270k + Equity',
        recruiterPressure: 'high',
        hiringWindow: 'Closes in 6 days',
        stackCompatibility: 'PyTorch, CUDA, vLLM, Python, Vector DBs',
        alignmentReasoning: 'Extreme model engineering alignment. Acquiring custom CUDA optimization proofs solves primary blocker.'
      },
      {
        title: 'ML Systems Engineer',
        company: 'OpenAI',
        alignmentScore: 0.89,
        confidence: 0.86,
        urgency: 'high',
        type: 'Full-time / SF Hybrid',
        missingRequirements: ['CUDA Kernel Optimization', 'Model Distillation'],
        proofGaps: ['High-throughput model serving deployment configs'],
        compensation: '$230k - $300k',
        recruiterPressure: 'high',
        hiringWindow: 'Closes in 8 days',
        stackCompatibility: 'PyTorch, CUDA, C++, Kubernetes, Triton',
        alignmentReasoning: 'Deep model operations focus. CUDA kernel knowledge is a non-negotiable entry credential.'
      }
    ],
    recruiterProfile: {
      hiringConfidence: 0.88,
      productionReadiness: 0.92,
      technicalDepth: 0.94,
      specializationStrength: 0.89,
      differentiationScore: 0.91,
      portfolioMaturity: 'production_mature',
      strongestSignals: [
        'Validated transformer weights adjustment workflows',
        'Expert-level FastAPI server setups for embeddings extraction',
        'Sub-millisecond vector indexing implementation proof'
      ],
      hiringRisks: [
        'Minimal GPU hardware-level custom logic proof (CUDA gaps)',
        'No direct experience in small-model distillation workflows'
      ],
      roleFit: [
        { role: 'AI Platform Architect', skillReadiness: 0.92, proofAdjusted: 0.89, missing: ['CUDA Kernel Optimization'] },
        { role: 'ML Systems Engineer', skillReadiness: 0.87, proofAdjusted: 0.84, missing: ['CUDA Kernel Optimization'] }
      ]
    },
    marketIntel: {
      title: 'AI Systems Engineering',
      description: 'Exponential market interest in GPU scale, specialized model fine-tuning, and inference execution.',
      salaryRange: '$180k - $310k',
      growthRate: 'Exponential (+28% YoY)',
      demandTrend: 'up',
      demandChangePercent: 28
    }
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    specialization: 'CI/CD Pipelines & Security hardening',
    targetRole: 'Lead DevOps & Release Engineer',
    strongestSkills: ['GitHub Actions', 'Jenkins', 'Docker', 'Linux Core', 'SSL/Security Certs'],
    weakestSkills: ['ArgoCD GitOps', 'Kubernetes Helm Packages', 'Cloud Cost Management'],
    metrics: {
      matchScore: 89.2,
      careerVelocity: 83.0,
      marketFit: 87.0,
      recruiterConfidence: 83.0
    },
    metricsHistory: {
      matchScore: [86.0, 86.8, 87.2, 87.5, 88.0, 88.4, 88.8, 89.0, 89.1, 89.2],
      careerVelocity: [75.0, 77.0, 78.5, 79.8, 80.5, 81.2, 82.0, 82.4, 82.8, 83.0],
      marketFit: [83.0, 83.8, 84.2, 84.8, 85.3, 85.9, 86.2, 86.6, 86.9, 87.0],
      recruiterConfidence: [78.0, 79.0, 79.9, 80.5, 81.2, 81.8, 82.2, 82.6, 82.8, 83.0]
    },
    roadmap: [
      {
        skill: 'ArgoCD GitOps',
        priority: 'high',
        effortWeeks: 4,
        impactEstimate: 89,
        reason: 'Implements declarative Git-driven deployment pipelines to avoid configuration drift.',
        status: 'active',
        dependencies: ['Kubernetes'],
        completionConfidence: 85,
        projectedImpact: 'Eliminates manually executed sync runs, ensuring 100% deployment tracking.',
        strategicRationale: 'Continuous delivery is maturing towards GitOps models; ArgoCD is the leading framework.'
      },
      {
        skill: 'Kubernetes Helm Packages',
        priority: 'high',
        effortWeeks: 3,
        impactEstimate: 84,
        reason: 'Standardizes complex cloud resource template deployments via dynamic parameter charts.',
        status: 'active',
        dependencies: ['Docker', 'YAML templating'],
        completionConfidence: 90,
        projectedImpact: 'Cuts infrastructure config boilerplate files by over 70%.',
        strategicRationale: 'Kubernetes deployment templates must be packaged to support reliable environment configurations.'
      },
      {
        skill: 'Cloud Cost Management',
        priority: 'medium',
        effortWeeks: 3,
        impactEstimate: 78,
        reason: 'Enforces CPU/RAM resource limits and alerts on orphaned development disks.',
        status: 'active',
        dependencies: [],
        completionConfidence: 75,
        projectedImpact: 'Identifies and deletes waste, pruning infrastructure cloud billing by 25%.',
        strategicRationale: 'Modern operational practices prioritize resource efficiency and spend audits.'
      }
    ],
    opportunities: [
      {
        title: 'Lead DevOps Engineer',
        company: 'Vercel',
        alignmentScore: 0.91,
        confidence: 0.88,
        urgency: 'high',
        type: 'Full-time / Remote',
        missingRequirements: ['ArgoCD GitOps'],
        proofGaps: ['GitOps pipeline deployment templates'],
        compensation: '$180k - $220k',
        recruiterPressure: 'high',
        hiringWindow: 'Closes in 7 days',
        stackCompatibility: 'GitHub Actions, Docker, ArgoCD, Kubernetes',
        alignmentReasoning: 'Strong fit for Git-centric build workflows. GitOps expertise represents the vital target skill.'
      },
      {
        title: 'Infrastructure Automation Engineer',
        company: 'Stripe',
        alignmentScore: 0.87,
        confidence: 0.84,
        urgency: 'medium',
        type: 'Hybrid / SF',
        missingRequirements: ['Kubernetes Helm Packages'],
        proofGaps: ['Helm repository deployment index configuration file'],
        compensation: '$190k - $230k',
        recruiterPressure: 'medium',
        hiringWindow: 'Closes in 10 days',
        stackCompatibility: 'Helm, Kubernetes, Jenkins, Terraform',
        alignmentReasoning: 'Aligns with core scripting and release engineering background. Helm is the key missing piece.'
      }
    ],
    recruiterProfile: {
      hiringConfidence: 0.83,
      productionReadiness: 0.91,
      technicalDepth: 0.84,
      specializationStrength: 0.92,
      differentiationScore: 0.86,
      portfolioMaturity: 'production_mature',
      strongestSignals: [
        'Secure multi-tier build orchestrations configurations',
        'Expert-level caching in shell environments',
        'Impeccable SSL cert automation logs'
      ],
      hiringRisks: [
        'Lack of GitOps push-to-state validation mechanisms',
        'No direct documentation of Helm-charts deployments'
      ],
      roleFit: [
        { role: 'Lead DevOps Engineer', skillReadiness: 0.92, proofAdjusted: 0.89, missing: ['ArgoCD GitOps'] },
        { role: 'Infrastructure Automation Engineer', skillReadiness: 0.85, proofAdjusted: 0.82, missing: ['Helm Packages'] }
      ]
    },
    marketIntel: {
      title: 'DevOps / Release Engineering',
      description: 'High market value on security automation, reproducible build state engines, and cost tracking.',
      salaryRange: '$150k - $215k',
      growthRate: 'Steady (+10% YoY)',
      demandTrend: 'stable',
      demandChangePercent: 10
    }
  }
];
