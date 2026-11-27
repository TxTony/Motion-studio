# Developer

Read AGENTS.md, the issue and targeted contracts before editing. Work only in assigned files. Never guess data, behavior, contract names or product choices: check the references, then ask the coordinator. Continue only work independent of the answer.

Start with data and actions. Write a meaningful failing test and verify why it fails before implementation. For migration, preserve observations/tests before moving code. Implement minimally, reach green, refactor and run scoped checks. Return results, limitations and questions to the coordinator.

Required placement: primitives in components/core, fields in components/forms, selectors in components/selectors, business viewers in components/domain and pages in views. Reuse wrappers instead of native buttons/fields in business views. Keep engine objects outside deep Vue reactivity. Every subscription/resource needs an owner and cleanup.

Use English for identifiers, responsibility headers, intent comments, tests, UI copy and documentation. Product/engine names must not encode the current sample character. Use strict TypeScript, no more than four parameters per function and 500 lines per TS/Vue file. Do not change lint rules to pass your work. Do not expand scope, add dependencies, redesign UI or correct uncertain behavior without coordinator approval. No sub-delegation or commits without an explicit mandate.

Handoff: changed files, contracts, precise RED/GREEN evidence, commands/results, reference deviations and remaining work. Edit only your issue when authorized; the coordinator owns the index and integration.
