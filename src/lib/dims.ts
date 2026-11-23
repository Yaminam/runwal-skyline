// Intrinsic sizes of the local images, for next/image. Split by owner so pages can be built in parallel.
import { COMPANY_DIMS } from "./dims-company";
import { COVERAGE_DIMS } from "./dims-coverage";
import { PROJECT_DIMS } from "./dims-projects";
import { SOCIAL_DIMS } from "./dims-social";

export const DIMS: Record<string, [number, number]> = { ...PROJECT_DIMS, ...COMPANY_DIMS, ...SOCIAL_DIMS, ...COVERAGE_DIMS };
