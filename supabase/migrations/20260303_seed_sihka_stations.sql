-- Seed Initial Stations for SIHKA Citanduy Integration
INSERT INTO public.master_stasiun (nama_stasiun, koordinat_x, koordinat_y, elevasi, keterangan) VALUES
('Panjalu', 108.2711, -7.1242, 730, 'SIHKA ID: 63'),
('Panawangan', 108.3842, -7.0983, 620, 'SIHKA ID: 62'),
('Sadananya', 108.3245, -7.2842, 450, 'SIHKA ID: 65'),
('Sidamulih', 108.4562, -7.6542, 120, 'SIHKA ID: 66'),
('Tanjungsukur', 108.5242, -7.3452, 50, 'SIHKA ID: 85'),
('Cikupa', 108.2145, -7.4212, 350, 'SIHKA ID: 50'),
('Kawali', 108.3562, -7.1842, 420, 'SIHKA ID: 58'),
('Rancah', 108.5123, -7.2142, 380, 'SIHKA ID: 64'),
('Kaso', 108.4212, -7.2562, 310, 'SIHKA ID: 30'),
('Janggala', 108.4842, -7.3842, 150, 'SIHKA ID: 19'),
('Ciamis', 108.3542, -7.3242, 210, 'SIHKA ID: 44')
ON CONFLICT (nama_stasiun) DO NOTHING;
