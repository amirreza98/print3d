-- Sample catalog matching the frontend seed data (frontend/lib/api.ts).
-- Available materials per product are derived from these material_price rows.

INSERT INTO product (id, name, description, stl_s3_key, thumbnail_s3_key, base_price, active)
VALUES
    ('phone-stand', 'Adjustable phone stand', 'Angled desk stand with a cable channel.',
     'stl/phone-stand.stl', 'thumbnails/phone-stand.png', 12.50, TRUE),
    ('planter', 'Geometric planter', 'Faceted low-poly planter with drainage.',
     'stl/planter.stl', 'thumbnails/planter.png', 18.00, TRUE),
    ('bracket', 'Wall mount bracket', 'Load-bearing L-bracket, screw-ready.',
     'stl/bracket.stl', 'thumbnails/bracket.png', 9.00, TRUE);

-- phone-stand: PLA, PETG, ABS
INSERT INTO material_price (id, product_id, material, size_label, price_per_gram)
VALUES
    (gen_random_uuid(), 'phone-stand', 'PLA',  'S', 0.0450),
    (gen_random_uuid(), 'phone-stand', 'PLA',  'M', 0.0430),
    (gen_random_uuid(), 'phone-stand', 'PLA',  'L', 0.0410),
    (gen_random_uuid(), 'phone-stand', 'PETG', 'S', 0.0600),
    (gen_random_uuid(), 'phone-stand', 'PETG', 'M', 0.0580),
    (gen_random_uuid(), 'phone-stand', 'ABS',  'S', 0.0550),
    (gen_random_uuid(), 'phone-stand', 'ABS',  'L', 0.0510);

-- planter: PLA, PETG
INSERT INTO material_price (id, product_id, material, size_label, price_per_gram)
VALUES
    (gen_random_uuid(), 'planter', 'PLA',  'M', 0.0430),
    (gen_random_uuid(), 'planter', 'PLA',  'L', 0.0410),
    (gen_random_uuid(), 'planter', 'PETG', 'M', 0.0580),
    (gen_random_uuid(), 'planter', 'PETG', 'L', 0.0560);

-- bracket: ABS, PETG, resin
INSERT INTO material_price (id, product_id, material, size_label, price_per_gram)
VALUES
    (gen_random_uuid(), 'bracket', 'ABS',   'S', 0.0550),
    (gen_random_uuid(), 'bracket', 'ABS',   'M', 0.0530),
    (gen_random_uuid(), 'bracket', 'PETG',  'S', 0.0600),
    (gen_random_uuid(), 'bracket', 'PETG',  'M', 0.0580),
    (gen_random_uuid(), 'bracket', 'resin', 'S', 0.1200),
    (gen_random_uuid(), 'bracket', 'resin', 'M', 0.1150);
