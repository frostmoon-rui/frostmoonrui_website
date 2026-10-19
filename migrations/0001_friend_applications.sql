CREATE TABLE friend_applications (
 id TEXT PRIMARY KEY,
 url TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 description TEXT NOT NULL,
 locale TEXT NOT NULL,
 links_url TEXT NOT NULL DEFAULT '',
 icon_url TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 publication_json TEXT,
 reviewed_at TEXT,
 version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX friend_applications_status ON friend_applications(status,created_at);
