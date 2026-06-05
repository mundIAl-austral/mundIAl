# Plan: Personalized Recommendation Flow con Feedback

## Flujo completo

```
Setup (pasos 1–4)
    → POST /api/v1/recommend/preview   (perfil → 5 partidos diversos)
    → /feedback  (usuario: like/dislike × 5)
    → POST /api/v1/recommend + feedback  (pesos ajustados → 72 partidos clasificados)
    → /results
```

---

## Algoritmo de personalización

### Paso 1 — Selección de 5 partidos (Farthest-Point Sampling)

Dado el perfil del usuario, se computa la matriz de features (72, 11). Se eligen 5 partidos
maximalmente separados en ese espacio:

1. Primer punto: el partido más cercano al centroide de los 72
2. Cada iteración: agrega el partido que maximiza la distancia mínima a los ya seleccionados

```python
def farthest_point_sampling(feature_matrix: np.ndarray, k: int = 5) -> list[int]
```

### Paso 2 — Ajuste de pesos (Gradient Descent con regularización L2)

Con el feedback del usuario (5 pares feature/liked), se optimiza:

```
loss(w) = cross_entropy(sigmoid(X @ w), y) + λ * ||w - w_default||²
```

- `λ = 1.0` — mantiene los pesos cerca del prior; evita overfitting con 5 muestras
- 50 iteraciones de gradient descent con `lr = 0.05`
- Pesos clippeados a `[-5, 5]`
- Solo usa `numpy` (sin scipy ni dependencias nuevas)

```python
def adjust_weights(
    feedback_features: np.ndarray,  # (5, 11)
    feedback_labels: np.ndarray,    # (5,) — 1=liked, 0=disliked
    w_default: np.ndarray,          # pesos default de classifier.py
    lam: float = 1.0,
) -> np.ndarray
```

---

## API

### Nuevo endpoint

```
POST /api/v1/recommend/preview
Body: UserProfile (igual que /recommend)
Response: { "matches": [MatchRecommendation × 5] }
```

### Endpoint existente extendido

```
POST /api/v1/recommend
Body: UserProfile + "feedback": [{"match_id": str, "liked": bool}] (opcional)
Response: { "imperdible": [...], "vale_la_pena": [...], "para_el_resumen": [...] }
```

Si `feedback` está presente → ajusta pesos → re-rankea con `w_personalized`.
Si `feedback` ausente → comportamiento actual sin cambios.

---

## Arquitectura

### Backend — archivos nuevos

| Archivo | Contenido |
|---|---|
| `backend/app/ml/weight_tuner.py` | `farthest_point_sampling()` + `adjust_weights()` |

### Backend — archivos modificados

| Archivo | Cambio |
|---|---|
| `app/ml/classifier.py` | Exportar `DEFAULT_WEIGHTS`; agregar param `custom_weights` a `predict()` |
| `recommendations_schemas.py` | Agregar `FeedbackItem`, `PreviewResponse`; extender `UserProfile` con `feedback?` |
| `recommendations_service.py` | Agregar `get_preview()`; modificar `get_recommendations()` para consumir feedback |
| `recommendations_routes.py` | Agregar `POST /recommend/preview` |

### Frontend — archivos nuevos

| Archivo | Contenido |
|---|---|
| `src/routes/feedback.tsx` | Pantalla de 5 partidos con botones like/dislike |

### Frontend — archivos modificados

| Archivo | Cambio |
|---|---|
| `src/types/index.ts` | Agregar `FeedbackItem`, `PreviewResponse` |
| `src/api/recommendations.ts` | Agregar `getPreview()` |
| `src/routes/setup.tsx` | Step 4 navega a `/feedback` en vez de `/` |

> `src/routeTree.gen.ts` se regenera automáticamente por TanStack Router al agregar `feedback.tsx`.

---

## Fases de desarrollo

### Fase 1 — Backend ML
- Crear `weight_tuner.py` con `farthest_point_sampling` y `adjust_weights`
- Refactorizar `classifier.py`: exportar `DEFAULT_WEIGHTS`, agregar `custom_weights`

### Fase 2 — Backend endpoints
- Schemas: `FeedbackItem`, `PreviewResponse`, extender `UserProfile`
- Service: `get_preview()`, modificar `get_recommendations()`
- Routes: `POST /recommend/preview`
- Quality gates: `ruff check`, `mypy`, `pytest`

### Fase 3 — Frontend feedback route
- Tipos en `types/index.ts`
- `getPreview()` en `api/recommendations.ts`
- Crear `src/routes/feedback.tsx`
- Modificar `setup.tsx`: redirigir a `/feedback` al terminar paso 4

### Fase 4 — Integración
- Verificar flujo completo: setup → feedback → results
- Verificar ruta de skip (sin feedback)
- `npm run build` — 0 errores de tipos

---

## Verificación

```bash
# Backend quality gates
cd backend
uv run ruff check app/
uv run ruff format --check app/
uv run mypy app/
uv run pytest tests/

# Smoke test — preview
curl -X POST http://localhost:8000/api/v1/recommend/preview \
  -H "Content-Type: application/json" \
  -d '{"favorite_teams":["Argentina"],"favorite_players":[],"ics_content":"","timezone":"America/Argentina/Buenos_Aires","country":"AR"}'
# Debe retornar exactamente 5 partidos

# Smoke test — recommend con feedback
curl -X POST http://localhost:8000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"favorite_teams":["Argentina"],"favorite_players":[],"ics_content":"","timezone":"America/Argentina/Buenos_Aires","country":"AR","feedback":[{"match_id":"A1","liked":true},{"match_id":"B3","liked":false},{"match_id":"C2","liked":true},{"match_id":"D1","liked":false},{"match_id":"E4","liked":true}]}'
# Debe retornar 3 categorías con pesos personalizados

# Frontend
cd frontend && npm run build
```
