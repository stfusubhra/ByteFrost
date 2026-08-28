"""add logistics tables

Revision ID: 002_logistics
Revises: bbc8c3fdaeae
Create Date: 2026-08-28 09:50:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '002_logistics'
down_revision: Union[str, None] = 'bbc8c3fdaeae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Enum type objects — reused in upgrade and downgrade
vehicletype_enum = sa.Enum('STANDARD', 'REFRIGERATED', name='vehicletype')
vehiclestatus_enum = sa.Enum('AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'INACTIVE', name='vehiclestatus')
hubtype_enum = sa.Enum('LOCAL', 'REGIONAL', name='hubtype')
hubstatus_enum = sa.Enum('ACTIVE', 'INACTIVE', name='hubstatus')
routestatus_enum = sa.Enum('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', name='routestatus')
stoptype_enum = sa.Enum('PICKUP', 'HUB', 'DROP', name='stoptype')
logisticseventtype_enum = sa.Enum(
    'PLANNED', 'TRUCK_ASSIGNED', 'PICKUP_STARTED', 'PICKUP_DONE',
    'HUB_ARRIVED', 'HUB_DEPARTED', 'IN_TRANSIT', 'DELIVERED',
    'TRUCK_BREAKDOWN', 'REROUTED', 'FARMER_CANCELLED', 'CANCELLED',
    name='logisticseventtype',
)


def upgrade() -> None:
    # =========================================================================
    # Step 1: Create enum types
    # =========================================================================
    vehicletype_enum.create(op.get_bind(), checkfirst=True)
    vehiclestatus_enum.create(op.get_bind(), checkfirst=True)
    hubtype_enum.create(op.get_bind(), checkfirst=True)
    hubstatus_enum.create(op.get_bind(), checkfirst=True)
    routestatus_enum.create(op.get_bind(), checkfirst=True)
    stoptype_enum.create(op.get_bind(), checkfirst=True)
    logisticseventtype_enum.create(op.get_bind(), checkfirst=True)

    # =========================================================================
    # Step 2: CREATE TABLE vehicles (no FK deps)
    # =========================================================================
    op.create_table('vehicles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('capacity_kg', sa.Float(), nullable=False),
        sa.Column('vehicle_type', vehicletype_enum, nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('status', vehiclestatus_enum, nullable=True),
        sa.Column('current_load_kg', sa.Float(), nullable=False, server_default='0'),
        sa.Column('operating_cost_per_km', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('capacity_kg > 0', name='ck_vehicles_capacity'),
        sa.CheckConstraint('current_load_kg >= 0', name='ck_vehicles_current_load'),
        sa.CheckConstraint('operating_cost_per_km > 0', name='ck_vehicles_operating_cost'),
    )

    # =========================================================================
    # Step 3: CREATE TABLE hubs (no FK deps)
    # =========================================================================
    op.create_table('hubs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hub_type', hubtype_enum, nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('capacity_kg', sa.Float(), nullable=False),
        sa.Column('current_load_kg', sa.Float(), nullable=False, server_default='0'),
        sa.Column('status', hubstatus_enum, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('capacity_kg > 0', name='ck_hubs_capacity'),
        sa.CheckConstraint('current_load_kg >= 0', name='ck_hubs_current_load'),
    )

    # =========================================================================
    # Step 4: ALTER TABLE orders — add produce_type, quantity_kg
    # =========================================================================
    op.add_column('orders', sa.Column('produce_type', sa.String(length=255), nullable=True))
    op.add_column('orders', sa.Column('quantity_kg', sa.Float(), nullable=True))

    # =========================================================================
    # Step 5: CREATE TABLE routes (FK -> vehicles)
    # =========================================================================
    op.create_table('routes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('vehicle_id', sa.UUID(), nullable=False),
        sa.Column('distance_km', sa.Float(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('status', routestatus_enum, nullable=True),
        sa.Column('route_mode', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id']),
        sa.CheckConstraint('distance_km >= 0', name='ck_routes_distance'),
        sa.CheckConstraint('duration_minutes >= 0', name='ck_routes_duration'),
    )
    op.create_index(op.f('ix_routes_vehicle_id'), 'routes', ['vehicle_id'])

    # =========================================================================
    # Step 6: CREATE TABLE route_stops (FK -> routes, users x2, hubs)
    # =========================================================================
    op.create_table('route_stops',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('route_id', sa.UUID(), nullable=False),
        sa.Column('stop_type', stoptype_enum, nullable=False),
        sa.Column('farmer_id', sa.UUID(), nullable=True),
        sa.Column('hub_id', sa.UUID(), nullable=True),
        sa.Column('buyer_id', sa.UUID(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('quantity_kg', sa.Float(), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('time_window_earliest', sa.DateTime(timezone=True), nullable=True),
        sa.Column('time_window_latest', sa.DateTime(timezone=True), nullable=True),
        sa.Column('max_transit_hours', sa.Float(), nullable=True),
        sa.Column('eta', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id']),
        sa.ForeignKeyConstraint(['farmer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['hub_id'], ['hubs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id']),
        sa.UniqueConstraint('route_id', 'sequence', name='uq_route_stops_route_sequence'),
        sa.CheckConstraint('quantity_kg >= 0', name='ck_route_stops_quantity'),
        sa.CheckConstraint('sequence >= 1', name='ck_route_stops_sequence'),
    )
    op.create_index(op.f('ix_route_stops_route_id'), 'route_stops', ['route_id'])
    op.create_index(op.f('ix_route_stops_farmer_id'), 'route_stops', ['farmer_id'])
    op.create_index(op.f('ix_route_stops_hub_id'), 'route_stops', ['hub_id'])
    op.create_index(op.f('ix_route_stops_buyer_id'), 'route_stops', ['buyer_id'])

    # =========================================================================
    # Step 7: ALTER TABLE shipments — add logistics columns + FKs
    # =========================================================================
    op.add_column('shipments', sa.Column('order_id', sa.UUID(), nullable=True))
    op.add_column('shipments', sa.Column('route_id', sa.UUID(), nullable=True))
    op.add_column('shipments', sa.Column('vehicle_id', sa.UUID(), nullable=True))
    op.add_column('shipments', sa.Column('pickup_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('shipments', sa.Column('delivery_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('shipments', sa.Column('landed_cost', sa.Float(), nullable=True))
    op.add_column('shipments', sa.Column('consolidation_savings_km', sa.Float(), nullable=True))
    op.add_column('shipments', sa.Column('route_mode', sa.String(length=20), nullable=True))

    op.create_foreign_key('fk_shipments_order_id', 'shipments', 'orders', ['order_id'], ['id'])
    op.create_foreign_key('fk_shipments_route_id', 'shipments', 'routes', ['route_id'], ['id'])
    op.create_foreign_key('fk_shipments_vehicle_id', 'shipments', 'vehicles', ['vehicle_id'], ['id'])
    op.create_index(op.f('ix_shipments_order_id'), 'shipments', ['order_id'])
    op.create_index(op.f('ix_shipments_route_id'), 'shipments', ['route_id'])

    # =========================================================================
    # Step 8: ALTER TABLE allocations — add logistics columns
    # =========================================================================
    op.add_column('allocations', sa.Column('farmer_reliability_score', sa.Float(), nullable=True))
    op.add_column('allocations', sa.Column('hub_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_allocations_hub_id', 'allocations', 'hubs', ['hub_id'], ['id'])

    # =========================================================================
    # Step 9: CREATE TABLE hub_inventory (FK -> hubs, produce_listings, users)
    # =========================================================================
    op.create_table('hub_inventory',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('hub_id', sa.UUID(), nullable=False),
        sa.Column('listing_id', sa.UUID(), nullable=False),
        sa.Column('quantity_kg', sa.Float(), nullable=False),
        sa.Column('arrived_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('quality_verified', sa.Boolean(), nullable=True),
        sa.Column('quality_grade_verified', sa.String(length=50), nullable=True),
        sa.Column('weighed_by', sa.UUID(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['hub_id'], ['hubs.id']),
        sa.ForeignKeyConstraint(['listing_id'], ['produce_listings.id']),
        sa.ForeignKeyConstraint(['weighed_by'], ['users.id']),
        sa.CheckConstraint('quantity_kg > 0', name='ck_hub_inventory_quantity'),
    )
    op.create_index(op.f('ix_hub_inventory_hub_id'), 'hub_inventory', ['hub_id'])

    # =========================================================================
    # Step 10: CREATE TABLE farmer_reliability_scores (FK -> users, UNIQUE)
    # =========================================================================
    op.create_table('farmer_reliability_scores',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('farmer_id', sa.UUID(), nullable=False),
        sa.Column('reliability_score', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('total_orders_accepted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('orders_fulfilled_on_time', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('orders_cancelled', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_quantity_accuracy', sa.Float(), nullable=True),
        sa.Column('last_updated', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['farmer_id'], ['users.id']),
        sa.UniqueConstraint('farmer_id'),
        sa.CheckConstraint(
            'reliability_score >= 0.0 AND reliability_score <= 1.0',
            name='ck_farmer_reliability_score_range',
        ),
    )
    op.create_index(op.f('ix_farmer_reliability_scores_farmer_id'), 'farmer_reliability_scores', ['farmer_id'], unique=True)

    # =========================================================================
    # Step 11: CREATE TABLE logistics_events (FK -> shipments, CASCADE)
    # =========================================================================
    op.create_table('logistics_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shipment_id', sa.UUID(), nullable=False),
        sa.Column('event_type', logisticseventtype_enum, nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_logistics_events_shipment_id'), 'logistics_events', ['shipment_id'])

    # =========================================================================
    # Step 12: CREATE TABLE shipment_temperature_logs (FK -> shipments, CASCADE)
    # =========================================================================
    op.create_table('shipment_temperature_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shipment_id', sa.UUID(), nullable=False),
        sa.Column('temperature_celsius', sa.Float(), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_shipment_temperature_logs_shipment_id'), 'shipment_temperature_logs', ['shipment_id'])


def downgrade() -> None:
    # Step 1: Drop tables in reverse dependency order
    op.drop_table('shipment_temperature_logs')
    op.drop_table('logistics_events')

    op.drop_index(op.f('ix_farmer_reliability_scores_farmer_id'), table_name='farmer_reliability_scores')
    op.drop_table('farmer_reliability_scores')

    op.drop_index(op.f('ix_hub_inventory_hub_id'), table_name='hub_inventory')
    op.drop_table('hub_inventory')

    # Step 2: Revert allocations
    op.drop_constraint('fk_allocations_hub_id', 'allocations', type_='foreignkey')
    op.drop_column('allocations', 'hub_id')
    op.drop_column('allocations', 'farmer_reliability_score')

    # Step 3: Revert shipments
    op.drop_index(op.f('ix_shipments_route_id'), table_name='shipments')
    op.drop_index(op.f('ix_shipments_order_id'), table_name='shipments')
    op.drop_constraint('fk_shipments_vehicle_id', 'shipments', type_='foreignkey')
    op.drop_constraint('fk_shipments_route_id', 'shipments', type_='foreignkey')
    op.drop_constraint('fk_shipments_order_id', 'shipments', type_='foreignkey')
    op.drop_column('shipments', 'route_mode')
    op.drop_column('shipments', 'consolidation_savings_km')
    op.drop_column('shipments', 'landed_cost')
    op.drop_column('shipments', 'delivery_time')
    op.drop_column('shipments', 'pickup_time')
    op.drop_column('shipments', 'vehicle_id')
    op.drop_column('shipments', 'route_id')
    op.drop_column('shipments', 'order_id')

    # Step 4: Drop route_stops
    op.drop_index(op.f('ix_route_stops_buyer_id'), table_name='route_stops')
    op.drop_index(op.f('ix_route_stops_hub_id'), table_name='route_stops')
    op.drop_index(op.f('ix_route_stops_farmer_id'), table_name='route_stops')
    op.drop_index(op.f('ix_route_stops_route_id'), table_name='route_stops')
    op.drop_table('route_stops')

    # Step 5: Drop routes
    op.drop_index(op.f('ix_routes_vehicle_id'), table_name='routes')
    op.drop_table('routes')

    # Step 6: Revert orders
    op.drop_column('orders', 'quantity_kg')
    op.drop_column('orders', 'produce_type')

    # Step 7: Drop hubs and vehicles
    op.drop_table('hubs')
    op.drop_table('vehicles')

    # Step 8: Drop enum types
    logisticseventtype_enum.drop(op.get_bind(), checkfirst=True)
    stoptype_enum.drop(op.get_bind(), checkfirst=True)
    routestatus_enum.drop(op.get_bind(), checkfirst=True)
    hubstatus_enum.drop(op.get_bind(), checkfirst=True)
    hubtype_enum.drop(op.get_bind(), checkfirst=True)
    vehiclestatus_enum.drop(op.get_bind(), checkfirst=True)
    vehicletype_enum.drop(op.get_bind(), checkfirst=True)
