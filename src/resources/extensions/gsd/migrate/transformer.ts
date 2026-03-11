// Transformer: PlanningProject → GSDProject
// Stub — implementation in T02.

import type { PlanningProject, GSDProject } from './types.ts';

export function transformToGSD(_parsed: PlanningProject): GSDProject {
  return {
    milestones: [],
    projectContent: '',
    requirements: [],
    decisionsContent: '',
  };
}
