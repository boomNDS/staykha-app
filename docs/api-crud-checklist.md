# API CRUD Checklist

Full API CRUD checklist for all modules. Adjust paths, auth, and payloads to your backend.

## Teams

- POST /teams
  - Request: { name, ownerId }
  - Response: { team }
- GET /teams/:id
  - Response: { team }
- PATCH /teams/:id
  - Request: { name, logo?, settings? }
  - Response: { team }
- DELETE /teams/:id
  - Response: { success }

## Admins (Team Members)

- GET /teams/:teamId/admins
  - Response: { admins }
- POST /teams/:teamId/admins/invite
  - Request: { email, role }
  - Response: { invitation }
- GET /teams/:teamId/admins/invitations
  - Response: { invitations }
- POST /teams/:teamId/admins/invitations/:id/revoke
  - Response: { success }
- DELETE /teams/:teamId/admins/:id
  - Response: { success }

## Buildings

- POST /buildings
  - Request: { teamId, name, address?, floors?, notes? }
  - Response: { building }
- GET /buildings
  - Query: teamId, search?, page?, pageSize?
  - Response: { buildings, total }
- GET /buildings/:id
  - Response: { building }
- PATCH /buildings/:id
  - Request: { name?, address?, floors?, notes? }
  - Response: { building }
- DELETE /buildings/:id
  - Response: { success }

## Rooms

- POST /rooms
  - Request: { teamId, buildingId, roomNumber, floor, size?, monthlyRent?, status }
  - Response: { room }
- POST /rooms/bulk
  - Request: { teamId, buildingId, rooms: [{ roomNumber, floor, size?, rent? }] }
  - Response: { createdCount }
- GET /rooms
  - Query: teamId, buildingId?, status?, search?, page?, pageSize?
  - Response: { rooms, total }
- GET /rooms/:id
  - Response: { room }
- PATCH /rooms/:id
  - Request: { roomNumber?, floor?, size?, monthlyRent?, status? }
  - Response: { room }
- DELETE /rooms/:id
  - Response: { success }

## Tenants

- POST /tenants
  - Request: { teamId, name, email, phone?, roomId?, status }
  - Response: { tenant }
- GET /tenants
  - Query: teamId, status?, search?, page?, pageSize?
  - Response: { tenants, total }
- GET /tenants/:id
  - Response: { tenant }
- PATCH /tenants/:id
  - Request: { name?, email?, phone?, roomId?, status? }
  - Response: { tenant }
- DELETE /tenants/:id
  - Response: { success }

## Room Assignments

- POST /rooms/:id/assign-tenant
  - Request: { tenantId }
  - Response: { room, tenant }
- POST /rooms/:id/unassign-tenant
  - Response: { room }

## Meter Readings

- POST /readings
  - Request: {
      teamId,
      roomId,
      readingDate,
      water: { previousReading, currentReading }?,
      electric: { previousReading, currentReading }?,
      status
    }
  - Response: { readingGroup }
- GET /readings
  - Query: teamId, period?, status?, roomId?, page?, pageSize?
  - Response: { readings, total }
- GET /readings/:id
  - Response: { readingGroup }
- PATCH /readings/:id
  - Request: {
      readingDate?,
      water?,
      electric?,
      status?
    }
  - Response: { readingGroup }
- DELETE /readings/:id
  - Response: { success }

## Invoices (Billing)

- POST /invoices
  - Request: {
      teamId,
      readingGroupId,
      period,
      lineItems,
      total,
      status
    }
  - Response: { invoice }
- POST /invoices/generate/:readingGroupId
  - Response: { invoice }
- GET /invoices
  - Query: teamId, period?, status?, roomId?, tenantId?, page?, pageSize?
  - Response: { invoices, total }
- GET /invoices/:id
  - Response: { invoice }
- PATCH /invoices/:id
  - Request: { status?, lineItems?, total? }
  - Response: { invoice }
- DELETE /invoices/:id
  - Response: { success }

## Settings

- GET /settings/:teamId
  - Response: { settings }
- POST /settings/:teamId
  - Request: {
      waterRate,
      electricRate,
      fixedWaterRate?,
      invoicePrefix?,
      companyInfo?
    }
  - Response: { settings }

## Assets (Optional)

- POST /uploads
  - Request: multipart/form-data (file)
  - Response: { url, filename }

## Common Requirements

- Auth: Bearer token on all protected endpoints
- Pagination: { page, pageSize } + total count
- Errors: consistent error shape { message, code, fieldErrors? }
- Timezone: ISO 8601 for all timestamps and dates
