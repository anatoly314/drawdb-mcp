CREATE TYPE "order_status" AS ENUM (
	'placed',
	'paid',
	'shipped',
	'delivered',
	'cancelled'
);
