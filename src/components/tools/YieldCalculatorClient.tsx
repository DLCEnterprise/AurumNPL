'use client'

import { YieldCalculator, type YieldPrefill } from './YieldCalculator'

export function YieldCalculatorClient({ prefill }: { prefill?: YieldPrefill }) {
  return <YieldCalculator prefill={prefill} />
}
