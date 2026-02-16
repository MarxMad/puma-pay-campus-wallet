# Desplegar contratos en Stellar (Testnet)

Guía para compilar y desplegar todos los contratos Soroban en Stellar Testnet.

---

## Requisitos previos

1. **Stellar CLI** instalado:
   ```bash
   # macOS (Homebrew)
   brew install stellar/stellar-cli/stellar
   # o descarga: https://github.com/stellar/stellar-cli/releases
   ```

2. **Cuenta e identidad** para firmar el deploy:
   ```bash
   # Crear/agregar identidad "issuer" (tu cuenta que paga fees)
   stellar keys add issuer
   # Te pedirá la secret key de una cuenta Stellar con XLM en testnet
   ```
   Obtén XLM de testnet en: https://laboratory.stellar.org/#account-creator?network=test

3. **Red**: por defecto se usa **testnet**. Para mainnet cambia `--network testnet` por `--network mainnet`.

---

## Orden de despliegue

Despliega en este orden porque algunos contratos dependen de otros:

1. **simple-verifier** (o ultrahonk si lo usas) – lo usa savings-goals
2. **savings-goals** – metas de ahorro + ZK proofs
3. **course-completion** – completitud de cursos (opcional)
4. **user-levels** – niveles Bronze/Silver/Gold/Platinum
5. **defindex** – ahorros con rendimientos (APY)

---

## Comandos (desde la raíz del repo)

Abre una terminal en: `puma-pay-campus-wallet/`

### 1. Simple Verifier (recomendado para testnet)

```bash
cd contracts
stellar contract build --package simple-verifier
stellar contract deploy \
  --wasm target/wasm32v1-none/release/simple_verifier.wasm \
  --source-account issuer \
  --network testnet \
  --alias simple-verifier
```

Guarda la **dirección del contrato** que imprime el deploy (ej. `CAE5SCP7O6...`). La necesitas para configurar savings-goals.

---

### 2. Savings Goals

```bash
cd contracts
stellar contract build --package savings-goals
stellar contract deploy \
  --wasm target/wasm32v1-none/release/savings_goals.wasm \
  --source-account issuer \
  --network testnet \
  --alias savings-goals
```

Luego configura el verificador (reemplaza `CONTRACT_ID_SAVINGS_GOALS` y `CONTRACT_ID_VERIFIER` por las direcciones reales, y `ADMIN_PUBLIC_KEY` por la cuenta admin, ej. tu G...):

```bash
stellar contract invoke \
  --id CONTRACT_ID_SAVINGS_GOALS \
  --source-account issuer \
  --network testnet \
  -- set_verifier \
  --caller ADMIN_PUBLIC_KEY \
  --verifier CONTRACT_ID_VERIFIER
```

---

### 3. Course Completion (opcional)

```bash
cd contracts
stellar contract build --package course-completion
stellar contract deploy \
  --wasm target/wasm32v1-none/release/course_completion.wasm \
  --source-account issuer \
  --network testnet \
  --alias course-completion
```

---

### 4. User Levels

```bash
cd contracts
stellar contract build --package user-levels
stellar contract deploy \
  --wasm target/wasm32v1-none/release/user_levels.wasm \
  --source-account issuer \
  --network testnet \
  --alias user-levels
```

Después puedes vincularlo a savings-goals y course-completion según la lógica de tu app.

---

### 5. DeFindex

```bash
cd contracts
stellar contract build --package defindex
stellar contract deploy \
  --wasm target/wasm32v1-none/release/defindex.wasm \
  --source-account issuer \
  --network testnet \
  --alias defindex
```

Luego configura en el contrato la dirección de **user-levels** (y lo que pida el contrato: asset, admin, etc.) según el código en `contracts/defindex/src/lib.rs`.

---

## Compilar todos a la vez

Desde `contracts/`:

```bash
cd contracts
stellar contract build
```

Esto compila todos los paquetes del workspace. Los WASM quedan en:

- `target/wasm32v1-none/release/simple_verifier.wasm`
- `target/wasm32v1-none/release/savings_goals.wasm`
- `target/wasm32v1-none/release/course_completion.wasm`
- `target/wasm32v1-none/release/user_levels.wasm`
- `target/wasm32v1-none/release/defindex.wasm`
- `target/wasm32v1-none/release/ultrahonk_verifier.wasm` (si compilas ultrahonk)

---

## Variables en el frontend

En `.env` del frontend (`puma-pay-campus-wallet/.env`) define las direcciones que uses:

```env
VITE_SAVINGS_GOALS_CONTRACT=CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN
VITE_SIMPLE_VERIFIER_CONTRACT=CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT
VITE_DEFINDEX_CONTRACT=<dirección de defindex>
VITE_USER_LEVELS_CONTRACT=<dirección de user-levels>
VITE_STELLAR_NETWORK=testnet
```

(Reemplaza por las direcciones que te devuelva cada `stellar contract deploy`.)

---

## Contratos ya desplegados (referencia)

Según `contracts/savings-goals/DEPLOYMENT_STATUS.md`:

| Contrato         | Dirección (testnet) | Estado   |
|------------------|---------------------|----------|
| Savings Goals v2 | `CAJG64TZBWXVQGAAWXT77UP6M6QUIER6WLTCYMFRAYSPPQ3734P5WHNN` | ✅ Activo |
| Simple Verifier  | `CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT` | ✅ Activo |
| Ultrahonk        | —                   | ❌ Error 500 (tamaño ~750KB) |

Para **redesplegar** uno de ellos, usa los mismos comandos; obtendrás una **nueva** dirección. Actualiza entonces el frontend y cualquier `invoke` que use ese contrato.

---

## Notas

- **Ultrahonk Verifier**: en testnet suele fallar por tamaño (~750KB). En este proyecto se usa **simple-verifier** para desarrollo.
- **Mainnet**: sustituye `--network testnet` por `--network mainnet` y asegúrate de que la cuenta `issuer` tenga XLM real.
- **Explorador testnet**: https://stellar.expert/explorer/testnet
