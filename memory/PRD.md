# MoneyFlow — Product Requirements Document

## Overview
MoneyFlow is a Spanish-language personal finance mobile app (Expo/React Native) with cream/coral premium visual identity. It lets users track income, expenses, accounts, categories, budgets, savings goals, and (most importantly) debts & loans in both directions ("I owe" and "They owe me").

## Auth
- **Local single-user** (no authentication). A default user is auto-created on first app start.

## Tech Stack
- Frontend: Expo Router, React Native, TanStack Query, expo-linear-gradient, react-native-svg, react-native-gifted-charts, Ionicons.
- Backend: FastAPI + MongoDB (motor).
- Charts: PieChart (donut) + BarChart from `react-native-gifted-charts`.
- No third-party integrations.

## Screens (implemented)
1. Inicio, Movimientos, Botón + central con menú rápido, Informes, Más.
2. Cuentas (CRUD), Categorías (CRUD), Presupuestos, Metas de ahorro, Deudas y préstamos, Detalle deuda, Registrar pago, Ajustes.

## Automated business rules (backend)
- remaining_amount = original_amount - sum(payments); status="paid" when 0.
- Each debt payment creates a linked transaction and updates account balance.
- Account balance recalculated from initial + transactions.
- POST /api/seed seeds accounts/categories/transactions/debts/budgets/goals.

## Backlog
- Filtros extra en Movimientos (cuenta, categoría).
- Recordatorios / movimientos recurrentes.
- IA, voz, WhatsApp (diferidos por el usuario).
