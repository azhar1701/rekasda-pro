-- Seed Initial Stations for Citanduy Basin
INSERT INTO public.master_stasiun (nama_stasiun, koordinat_x, koordinat_y, elevasi, keterangan) VALUES
('Panjalu', 108.2711, -7.1242, 730, NULL),
('Panawangan', 108.3842, -7.0983, 620, NULL),
('Sadananya', 108.3245, -7.2842, 450, NULL),
('Sidamulih', 108.4562, -7.6542, 120, NULL),
('Tanjungsukur', 108.5242, -7.3452, 50, NULL),
('Cikupa', 108.2145, -7.4212, 350, NULL),
('Kawali', 108.3562, -7.1842, 420, NULL),
('Rancah', 108.5123, -7.2142, 380, NULL),
('Kaso', 108.4212, -7.2562, 310, NULL),
('Janggala', 108.4842, -7.3842, 150, NULL),
('Ciamis', 108.3542, -7.3242, 210, NULL)
ON CONFLICT (nama_stasiun) DO NOTHING;
