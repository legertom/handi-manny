-- Add items JSONB column for multi-task bookings.
-- Stores an array of BookingItem objects (service, intake, photos, breakdown per item).

alter table bookings add column if not exists items jsonb not null default '[]';
