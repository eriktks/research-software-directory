/* Step 2: drop old collections, create indices */
db.commit.drop();
db.corporate_blog.drop();
db.corporate_person.drop();
db.corporate_project.drop();
db.organization_history.drop();
db.person_history.drop();
db.project.drop();
db.project_history.drop();
db.publication.drop();
db.software_history.drop();
db.zotero_cache.drop();
db.zotero_publication.drop();
db.zotero_publication_history.drop();
db.commit.createIndex({githubURL: 1});
db.mention.createIndex({zoteroKey: 1});
db.mention.createIndex({"primaryKey.id": 1});
db.organization.createIndex({"primaryKey.id": 1});
db.person.createIndex({"primaryKey.id": 1});
db.software.createIndex({"primaryKey.id": 1});
db.software_cache.createIndex({"primaryKey.id": 1});
