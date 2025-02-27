/**
 * Initial data for Music Library Catalog web application.
 */
INSERT INTO LibrarySeason (LookupID, LookupValue, SortPosition)
VALUES
  (1, 'Christmas', 10),
  (2, 'Easter', 20),
  (3, 'Festival', 30),
  (4, 'Thanksgiving', 40);
INSERT INTO LibrarySkill (LookupID, LookupValue, SortPosition)
VALUES
  (1, 'Easy', 100),
  (2, 'Easy Medium', 200),
  (3, 'Medium', 300),
  (4, 'Advanced', 400);
INSERT INTO LibraryTagGroup (TagGroupID, TagGroupName)
VALUES
  (1, 'Style'),
  (2, 'Ensemble'),
  (3, 'Language'),
  (4, 'Period'),
  (5, 'Faith Tradition');
INSERT INTO LibraryTag (TagID, TagGroup, TagName)
VALUES
  (1, 1, 'Chant'),
  (2, 1, 'Chorale'),
  (3, 1, 'Folk'),
  (4, 5, 'Hindu'),
  (5, 1, 'Jazz'),
  (6, 1, 'Spiritual'),
  (7, 1, 'Traditional Jewish'),
  (8, 5, 'Buddhist'),
  (9, 2, 'Children''s Choir'),
  (10, 2, 'Youth Choir'),
  (11, 2, 'Adult Choir'),
  (12, 2, 'Chamber Choir'),
  (13, 2, 'Handbells'),
  (14, 2, 'Community Choir'),
  (15, 2, 'Youth Band'),
  (16, 3, 'English'),
  (17, 3, 'French'),
  (18, 3, 'German'),
  (19, 3, 'Italian'),
  (20, 3, 'Latin'),
  (21, 3, 'Spanish'),
  (22, 4, 'Baroque'),
  (23, 4, 'Classical'),
  (24, 4, 'Medieval'),
  (25, 4, 'Modern'),
  (26, 4, 'Renaissance'),
  (27, 4, 'Romantic'),
  (28, 3, 'Hebrew'),
  (29, 2, 'Orchestral Score'),
  (30, 5, 'Christian'),
  (31, 5, 'Jewish'),
  (32, 5, 'Native American'),
  (33, 3, 'Catalan'),
  (34, 1, 'Gospel');
INSERT INTO LibraryKey (LookupID, LookupValue, SortPosition)
VALUES
  (1, 'C Major', 1),
  (2, 'G Major', 2),
  (3, 'D Major', 3),
  (4, 'A Major', 4),
  (5, 'E Major', 5),
  (6, 'B Major', 6),
  (7, 'F# Major', 7),
  (8, 'C# Major', 8),
  (9, 'Cb Major', 9),
  (10, 'Gb Major', 10),
  (11, 'Db Major', 11),
  (12, 'Ab Major', 12),
  (13, 'Eb Major', 13),
  (14, 'Bb Major', 14),
  (15, 'F Major', 15),
  (16, 'A Minor', 16),
  (17, 'E Minor', 17),
  (18, 'B Minor', 18),
  (19, 'F# Minor', 19),
  (20, 'C# Minor', 20),
  (21, 'G# Minor', 21),
  (22, 'D# Minor', 22),
  (23, 'A# Minor', 23),
  (24, 'Ab Minor', 24),
  (25, 'Eb Minor', 25),
  (26, 'Bb Minor', 26),
  (27, 'F Minor', 27),
  (28, 'C Minor', 28),
  (29, 'G Minor', 29),
  (30, 'D Minor', 30),
  (31, 'B Minor', 31),
  (32, 'Modal', 32),
  (33, 'Mode', 33),
  (34, 'Unmarked', 34);
INSERT INTO LibraryAccompaniment (LookupID, LookupValue, SortPosition)
VALUES
  (1, 'A cappella', 10),
  (2, 'Organ', 20),
  (3, 'Organ or Piano', 30),
  (4, 'Piano', 40),
  (5, 'Piano (for rehearsal only)', 50),
  (6, 'Two Pianos', 60);
INSERT INTO LibraryArrangement (LookupID, LookupValue, SortPosition)
VALUES
  (1, 'SATB', 10),
  (2, 'SSATB', 20),
  (3, 'SSAATB', 30),
  (4, 'SSAATTB', 40),
  (5, 'SSAATTBB', 50),
  (6, 'SA', 60),
  (7, 'SSA', 70),
  (8, 'SSAA', 80),
  (9, 'TB', 90),
  (10, 'TTB', 100),
  (11, 'TTBB', 110),
  (12, 'Handbells', 120);
INSERT INTO LibraryCompany (CompanyID, CompanyName, WebSite)
VALUES
  (1, 'Abingdon Press', NULL),
  (2, 'Alfred Music', 'https://www.alfred.com/'),
  (3, 'Belwin Mills Publishing Corporation', NULL),
  (4, 'Boosey & Hawkes', 'https://www.boosey.com/'),
  (5, 'Bourne Company', NULL),
  (6, 'Breitkopf & Härtel', 'https://www.breitkopf.com/'),
  (7, 'Bärenreiter Kassel', 'https://www.baerenreiter.com/en/'),
  (8, 'CF Peters Corporation', NULL),
  (9, 'Carl Fischer', 'https://www.carlfischer.com/'),
  (10, 'Choral Public Domain Library', 'https://cpld.org'),
  (11, 'Choristers Guild', 'https://www.choristersguild.org/'),
  (12, 'Colla Voce Music', 'https://www.collavoce.com/'),
  (13, 'Concordia', 'https://www.cph.org'),
  (14, 'Durand and Company', 'https://www.durand-salabert-eschig.com/'),
  (15, 'E. C. Schirmer Music Company', 'https://www.ecspublishing.com/brand/EC-Schirmer-Music-Company'),
  (16, 'EMI Blackwood Music, Inc.', NULL),
  (17, 'Earthsongs', 'https://earthsongschoralmusic.com/'),
  (18, 'Editions Salabert', 'https://www.halleonard.com/menu/2287/editions-salabert'),
  (19, 'Edward B. Marks Music Corporation', NULL),
  (20, 'Elkan-Vogel, Inc.', NULL),
  (21, 'Emerson Music', NULL),
  (22, 'Foxes Music Company', 'https://www.foxesmusic.com/'),
  (23, 'G. Schirmer Music', 'https://www.wisemusicclassical.com/'),
  (24, 'H. W. Gray Company', NULL),
  (25, 'Hal Leonard Corporation', 'https://www.halleonard.com/'),
  (26, 'Hal Walker Music', 'https://www.halwalkermusic.com/'),
  (27, 'Harold Flammer Music', NULL),
  (28, 'Hinshaw Music', 'https://www.hinshawmusic.com/'),
  (29, 'Hope Publishing Company', 'https://www.hopepublishing.com/'),
  (30, 'J. Fischer & Bro', NULL),
  (31, 'J. W. Pepper and Son, Inc', 'https://www.jwpepper.com/'),
  (32, 'Jason Shelton Music', 'https://jasonsheltonmusic.com/'),
  (33, 'Jubilate Music Group', 'https://jubilatemusic.com/'),
  (34, 'K S Music Co. Ltd.', NULL),
  (35, 'Kalmus', 'https://www.kalmus.com/'),
  (36, 'Lawson-Gould Music Publishers', NULL),
  (37, 'Lorenz Corporation', 'https://lorenz.com/'),
  (38, 'Musical Resources', 'https://musical-resources.com/'),
  (39, 'Musicnotes.com', 'www.musicnotes.com'),
  (40, 'Neil A. Kjos Music Company', 'https://kjos.com/choral.html'),
  (41, 'Novello & Company', 'http://www.wisemusic.com/'),
  (42, 'Oliver Ditson Company', NULL),
  (43, 'Oxford University Press', 'https://global.oup.com/academic/category/arts-and-humanities/sheet-music'),
  (44, 'Paulus Publications', 'https://www.facebook.com/stephenpaulus.inc/'),
  (45, 'Pavane Publishing', 'https://www.pavanepublishing.com/'),
  (46, 'Ricordi', 'https://www.ricordi.com/'),
  (47, 'Sam Fox Publishing', NULL),
  (48, 'Santa Barbara Music Publ.', 'https://sbmp.com/'),
  (49, 'Schmitt, Hall & McCreary Company', NULL),
  (50, 'Schott & Co. Ltd.', 'https://www.schott-music.com/'),
  (51, 'Shawnee Press', 'https://www.shawneepress.com/'),
  (52, 'Sheet Music Direct', 'https://www.sheetmusicdirect.com/'),
  (53, 'Sheet Music Plus', 'https://www.sheetmusicplus.com/'),
  (54, 'The Musical Source', 'https://www.musicalsource.com/'),
  (55, 'Theodore Presser', 'https://www.presser.com/'),
  (56, 'Universal Edition', 'https://www.universaledition.com/'),
  (57, 'Walton Music Company', 'https://www.jwpepper.com/sheet-music/new-walton-music-publications.list'),
  (58, 'Warner-Tamerlane Publishing Corp.', 'https://warnerchappell.com/'),
  (59, 'World Library of Sacred Music', 'https://warnerchappell.com/'),
  (60, 'World Music Press', 'https://www.worldmusicpress.com/'),
  (61, 'Yelton Rhodes Music', 'https://www.subitomusic.com/');
INSERT INTO LibraryHandbellEnsemble (LookupID, LookupValue, SortPosition)
VALUES
  (1, '1 Octave', 10),
  (2, '1-2 Octaves', 20),
  (3, '1-4 octaves', 30),
  (4, '2 Choirs - Bells and/or Chimes', 40),
  (5, '2 Octaves', 50),
  (6, '2 to 3 octaves or 3 to 5 octaves', 60),
  (7, '2, 0 or 5 Octaves', 21),
  (8, '2-3 Octaves', 80),
  (9, '2-4 Octaves', 90),
  (10, '2-5 Octaves', 100),
  (11, '2-6 Octaves', 110),
  (12, '3 Octaves', 120),
  (13, '3 or 5 Octaves', 130),
  (14, '3, 0, or 5 Octaves', 10),
  (15, '3-4 Octaves', 150),
  (16, '3-5 Octaves', 160),
  (17, '3-6 octaves', 170),
  (18, '3-7 Octaves', 180),
  (19, '4 Octaves', 190),
  (20, '4-5 octaves', 200),
  (21, '4-6 octaves', 210),
  (22, '5 Octaves', 220),
  (23, '5-7 Octaves', 230);
INSERT INTO LibraryKeyword (LookupID, LookupValue)
VALUES
  (1, 'Acceptance'),
  (2, 'Affirmation'),
  (3, 'Animals'),
  (4, 'Beauty'),
  (5, 'Blessings'),
  (6, 'Celebration'),
  (7, 'Change'),
  (8, 'Children'),
  (9, 'Comfort'),
  (10, 'Community'),
  (11, 'Compassion'),
  (12, 'Courage'),
  (13, 'Death'),
  (14, 'Direction'),
  (15, 'Diversity'),
  (16, 'Dreams'),
  (17, 'Earth'),
  (18, 'Faith'),
  (19, 'Freedom'),
  (20, 'Friendship'),
  (21, 'God'),
  (22, 'Gratitude'),
  (23, 'Grief'),
  (24, 'Healing'),
  (25, 'Heart'),
  (26, 'Hope'),
  (27, 'Journey'),
  (28, 'Joy'),
  (29, 'Justice'),
  (30, 'Life'),
  (31, 'Light'),
  (32, 'Loss'),
  (33, 'Love'),
  (34, 'Music'),
  (35, 'Mystery'),
  (36, 'Nature'),
  (37, 'Pain'),
  (38, 'Patriotism'),
  (39, 'Peace'),
  (40, 'Praise'),
  (41, 'Prayer'),
  (42, 'Promise'),
  (43, 'Reconciliation'),
  (44, 'Seasons'),
  (45, 'Song'),
  (46, 'Sorrow'),
  (47, 'Soul'),
  (48, 'Spirit'),
  (49, 'Truth'),
  (50, 'Understanding'),
  (51, 'Unity'),
  (52, 'Water'),
  (53, 'Wisdom');
INSERT INTO LibraryPerson (PersonID, LastName, FirstName, Dates, Comments, SearchKey)
VALUES
  (1, 'Anonymous', NULL, NULL, NULL, 'Anonymous'),
  (2, 'Bach', 'Johann Sebastian', '1685-1750', NULL, 'Bach, Johann Sebastian (1685-1750)'),
  (3, 'Barber', 'Samuel', '1910-1981', NULL, 'Barber, Samuel (1910-1981)'),
  (4, 'Barnwell', 'Ysaye M.', '1946-', NULL, 'Barnwell, Ysaye M. (1946-)'),
  (5, 'Beethoven', 'Ludwig van', '1770-1827', NULL, 'Beethoven, Ludwig van (1770-1827)'),
  (6, 'Behnke', 'John A.', '1953-', NULL, 'Behnke, John A. (1953-)'),
  (7, 'Bernstein', 'Leonard', '1918-1990', NULL, 'Bernstein, Leonard (1918-1990)'),
  (8, 'Billings', 'William', '1746-1800', 'William Billings (1746 – 1800) is generally acknowledged to be one of the best Early American composers, though he was a tanner by trade and a self-taught musician. His music is typically vigorous and original, especially when compared to that of the other composers of his day. In addition to composing, he was a music publisher, taught singing, organized choirs, and introduced the use of the pitch pipe.', 'Billings, William (1746-1800)'),
  (9, 'Bradbury', 'William Batchelder', '1816-1868', NULL, 'Bradbury, William Batchelder (1816-1868)'),
  (10, 'Brahms', 'Johannes', '1833-1897', NULL, 'Brahms, Johannes (1833-1897)'),
  (11, 'Britten', '(Edward) Benjamin', '1913-1976', 'Lord Britten of Aldeburgh', 'Britten, (Edward) Benjamin (1913-1976)'),
  (12, 'Callahan', 'Frances L.', '1920-2017', NULL, 'Callahan, Frances L. (1920-2017)'),
  (13, 'Childers', 'Brian', '1971-', NULL, 'Childers, Brian (1971-)'),
  (14, 'Copland', 'Aaron', '1900-1990', NULL, 'Copland, Aaron (1900-1990)'),
  (15, 'Dickinson', 'Emily', '1830-1886', NULL, 'Dickinson, Emily (1830-1886)'),
  (16, 'Dilworth', 'Rollo A.', '1970-', NULL, 'Dilworth, Rollo A. (1970-)'),
  (17, 'Dobrinski', 'Cynthia', '1950-2021', NULL, 'Dobrinski, Cynthia (1950-2021)'),
  (18, 'Duruflé', 'Maurice', '1902-1986', NULL, 'Durufle, Maurice (1902-1986)'),
  (19, 'Goemanne', 'Noël', '1926-2010', NULL, 'Goemanne, Noel (1926-2010'),
  (20, 'Gruber', 'Franz Xaver', '1787-1863', NULL, 'Gruber, Franz Xaver (1787-1863)'),
  (21, 'Handel', 'George Frideric', '1685-1759', NULL, 'Handel, George Frideric (1685-1759)'),
  (22, 'Haydn', 'Franz Joseph', '1732-1809', NULL, 'Haydn, Franz Joseph (1732-1809)'),
  (23, 'Herbert', 'George', '1593-1633', NULL, 'Herbert, George (1593-1633)'),
  (24, 'Hindemith', 'Paul', '1895-1963', NULL, 'Hindemith, Paul (1895-1963)'),
  (25, 'Holst', 'Gustav Theodore', '1874-1934', NULL, 'Holst, Gustav Theodore (1874-1934)'),
  (26, 'Hopkins, Jr.', 'John Henry', '1820-1891', NULL, 'Hopkins, Jr., John Henry (1820-1891)'),
  (27, 'Johnson', 'Craig Hella', '1962-', NULL, 'Johnson, Craig Hella (1962-)'),
  (28, 'Kodály', 'Zoltán', '1882-1967', NULL, 'Kodaly, Zoltan (1882-1967)'),
  (29, 'Mendelssohn', 'Felix', '1809-1847', 'Jacob Ludwig Felix Mendelssohn-Bartholdy', 'Mendelssohn, Felix (1809-1847)'),
  (30, 'Mozart', 'Wolfgang Amadeus', '1756-1791', NULL, 'Mozart, Wolfgang Amadeus (1756-1791)'),
  (31, 'Poulenç', 'Francis (Jean Marcel)', '1899-1963', NULL, 'Poulenc, Francis (Jean Marcel) (1899-1963)'),
  (32, 'Purcell', 'Henry', '1659-1695', NULL, 'Purcell, Henry (1659-1695)'),
  (33, 'Rilke', 'Reiner Maria', '1875-1926', NULL, 'Rilke, Reiner Maria (1875-1962)'),
  (34, 'Rutter', 'John (Milford)', '1945-', NULL, 'Rutter, John (Milford) (1945-)'),
  (35, 'Schubert', 'Franz Peter', '1797-1828', NULL, 'Schubert, Franz Peter (1797-1828)'),
  (36, 'Schütz', 'Heinrich', '1585-1672', 'Also known as Henricus Sagittarius', 'Schutz, Heinrich (1585-1672)'),
  (37, 'Shaw', 'Kirby', '1942-', NULL, 'Shaw, Kirby (1942-)'),
  (38, 'Tchaïkovsky', 'Piotr Ilyitch', '1840-1893', NULL, 'Tchaikovsky, Piotr Ilyitch (1840-1893)'),
  (39, 'Thompson', 'Randall', '1899-1984', NULL, 'Thompson, Randall (1899-1984)'),
  (40, 'Vaughan-Williams', 'Ralph', '1872-1958', NULL, 'Vaughan-Williams, Ralph (1872-1958)'),
  (41, 'Verdi', '(Fortunino) Giuseppe Francesco', '1813-1901', NULL, 'Verdi, (Fortunino) Giuseppe Francesco (1813-1901)'),
  (42, 'Vivaldi', 'Antonio', 'c.1669-1741', NULL, 'Vivaldi, Antonio (c.1669-1741)'),
  (43, 'Warlock', 'Peter', '1894-1930', NULL, 'Warlock, Peter (1894-1930)'),
  (44, 'Whitman', 'Walt', '1819-1892', NULL, 'Whitman, Walt (1819-1892)'),
  (45, 'Woollen', 'C. Russell', '1923-1994', NULL, 'Woollen, C. Russell (1923-1994)');

