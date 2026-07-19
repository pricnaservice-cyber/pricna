-- Jednorázový import původních (dříve natvrdo nakódovaných) nabídek do tabulky properties.
-- Spustit pouze jednou: wrangler d1 execute pricna-db --file=seed-properties.sql [--remote]
-- Import se přeskočí, pokud už tabulka nějaké nemovitosti obsahuje.

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 15 m²', 'Příčná 1', 'Příčná 1, Havířov - Město', '15 m²', 'Ideální pro 1-2 osoby', '2 300 Kč/měsíc', '2 500 Kč/měsíc', '10 000 Kč',
    'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
    'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
    '["Recepce v budově","Klidné a příjemné pracovní prostředí","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost okamžitého nastěhování"]',
    '["images/kancelar_pricna/15m_1.jpeg","images/kancelar_pricna/15m_2.jpeg"]',
    NULL, 1, 10
WHERE NOT EXISTS (SELECT 1 FROM properties);

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 30 m²', 'Příčná 1', 'Příčná 1, Havířov - Město', '30 m²', 'Ideální pro 2-4 osoby', '4 600 Kč/měsíc', '5 000 Kč/měsíc', '20 000 Kč',
    'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
    'Nabízíme k pronájmu útulnou kancelář o velikosti 30 m², ideální pro dvě až čtyři osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
    '["Recepce v budově","Klidné a příjemné pracovní prostředí","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost okamžitého nastěhování"]',
    '["images/kancelar_pricna/pricna_30_1.JPG","images/kancelar_pricna/pricna_30_2.JPG","images/kancelar_pricna/pricna_30_3.JPG","images/kancelar_pricna/Pricna_30_4.JPG"]',
    NULL, 1, 20
WHERE (SELECT COUNT(*) FROM properties) = 1;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 45 m²', 'Příčná 1', 'Příčná 1, Havířov - Město', '45 m²', 'Pro menší firmu nebo tým', '6 900 Kč/měsíc', '7 500 Kč/měsíc', '25 000 Kč',
    'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
    'Nabízíme k pronájmu útulnou kancelář o velikosti 45 m², ideální pro menší firmu nebo tým lidí. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
    '["Recepce v budově","Klidné a příjemné pracovní prostředí","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost okamžitého nastěhování"]',
    '["images/kancelar_pricna/45m_1.jpeg","images/kancelar_pricna/45m_2.jpeg","images/kancelar_pricna/45m_3.jpeg","images/kancelar_pricna/45m_4.jpeg"]',
    NULL, 1, 30
WHERE (SELECT COUNT(*) FROM properties) = 2;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 15 m²', 'Příčná 2', 'Příčná 2, Havířov - Město', '15 m²', 'Ideální pro 1-2 osoby', '2 500 Kč/měsíc', '2 750 Kč/měsíc', '10 000 Kč',
    'Příčná Apartments s.r.o. je neplátce DPH - uvedené ceny jsou s DPH',
    'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
    '["Možnost využití recepce ve vedlejší budově","Možnost instalace umyvadla","Klidné a příjemné pracovní prostředí","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost okamžitého nastěhování"]',
    '["images/kancelar_pricna/15m_1.jpeg","images/kancelar_pricna/15m_2.jpeg"]',
    NULL, 1, 40
WHERE (SELECT COUNT(*) FROM properties) = 3;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 30 m²', 'Příčná 2', 'Příčná 2, Havířov - Město', '30 m²', 'Ideální pro 2-4 osoby', '5 000 Kč/měsíc', '5 500 Kč/měsíc', '20 000 Kč',
    'Příčná Apartments s.r.o. je neplátce DPH - uvedené ceny jsou s DPH',
    'Nabízíme k pronájmu útulnou kancelář o velikosti 30 m², ideální pro dvě až čtyři osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
    '["Možnost využití recepce ve vedlejší budově","Možnost instalace umyvadla","Klidné a příjemné pracovní prostředí","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost okamžitého nastěhování"]',
    '["images/kancelar_pricna/30m_1.jpeg","images/kancelar_pricna/30m_2.jpeg","images/kancelar_pricna/30m_3.jpeg","images/kancelar_pricna/30m_4.jpeg"]',
    NULL, 1, 50
WHERE (SELECT COUNT(*) FROM properties) = 4;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 15 m²', 'Dělnická 41', 'Dělnická 41, Havířov - Prostřední Suchá', '15 m²', 'Ideální pro 1-2 osoby', '2 000 Kč/měsíc', '2 700 Kč/měsíc', '10 000 Kč',
    'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
    'Nabízíme k pronájmu útulnou kancelář o velikosti 15 m², ideální pro jednu až dvě osoby. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Kancelář je světlá, čistá a připravená k okamžitému nastěhování.',
    '["Recepce v budově","Možnost privátního parkovacího místa","Klidné a příjemné pracovní prostředí","Blízkost obchodního komplexu","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost okamžitého nastěhování"]',
    '["images/kancelar_delnicka/delnicka_15_1.JPG"]',
    NULL, 1, 60
WHERE (SELECT COUNT(*) FROM properties) = 5;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'office', 'Kancelář 120 m²', 'Dělnická 41', 'Dělnická 41, Havířov - Prostřední Suchá', '120 m²', 'Pro menší až střední firmy', '20 000 Kč/měsíc', '21 600 Kč/měsíc', '80 000 Kč',
    'Příčná Offices s.r.o. je plátce DPH - uvedené ceny jsou bez DPH',
    'Nabízíme k pronájmu zrekonstruované prostory o velikosti 120 m² vhodné pro menší až střední firmy. Prostor se nachází v klidné a udržované budově, vhodné pro administrativní nebo podnikatelské účely. Možnost výběru Vámi preferované podlahové krytiny.',
    '["Recepce v budově","Možnost privátního parkovacího místa","Klidné a příjemné pracovní prostředí","Blízkost obchodního komplexu","Sdílené sociální zázemí a kuchyňka","Výborná dostupnost – MHD i parkování přímo u objektu","Nízké provozní náklady","Možnost výběru podlahové krytiny"]',
    '["images/kancelar_delnicka/delnicka_120_1.JPG","images/kancelar_delnicka/delnicka_120_2.JPG"]',
    NULL, 1, 70
WHERE (SELECT COUNT(*) FROM properties) = 6;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'apartment', 'Byt 1+kk', NULL, 'Příčná, Havířov', '29 m²', NULL, '5 330 Kč/měsíc', '2 956 Kč/měsíc', '15 000 Kč', NULL,
    'Nabízíme Vám k dlouhodobému pronájmu byt o dispozici 1+kk a výměře 29 m², který se nachází na ulici Příčné v Havířově. Bytová jednotka se nachází v bytovém domě, který prošel kompletní rekonstrukcí. Byt je světlý, útulný a připravený k okamžitému nastěhování.',
    '["Moderní kuchyňská linka","Varná deska","Trouba","Rychlá internetová přípojka","Sklepní kóje","Recepční služby"]',
    '["images/Byty/byt_11_kuchyne.JPG","images/Byty/byt_11_koupelna.JPG"]',
    'Ihned', 1, 10
WHERE (SELECT COUNT(*) FROM properties) = 7;

INSERT INTO properties (type, title, building, location, size, capacity, price, utilities, deposit, vatNote, description, features, images, available, published, sortOrder)
SELECT 'apartment', 'Byt 2+kk', NULL, 'Příčná, Havířov', '43 m²', NULL, '8 130 Kč/měsíc', '3 276 Kč/měsíc', '22 000 Kč', NULL,
    'Nabízíme Vám k dlouhodobému pronájmu byt o dispozici 2+kk a výměře 43 m², který se nachází na ulici Příčné v Havířově. Bytová jednotka se nachází v bytovém domě, který prošel kompletní rekonstrukcí. Byt je světlý, útulný a připravený k okamžitému nastěhování.',
    '["Moderní kuchyňská linka","Varná deska","Trouba","Rychlá internetová přípojka","Sklepní kóje","Recepční služby"]',
    '[]',
    'Ihned', 1, 20
WHERE (SELECT COUNT(*) FROM properties) = 8;
