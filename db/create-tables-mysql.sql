CREATE TABLE `LibraryAccompaniment` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibraryArrangement` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibraryAudit` (
	`AuditID` INTEGER NOT NULL AUTO_INCREMENT,
	`AuditWho` VARCHAR(20) NOT NULL,
	`AuditWhen` DATETIME NOT NULL,
	`AuditAction` VARCHAR(20) NOT NULL,
	`AuditTable` VARCHAR(32) NOT NULL,
	`AuditKey` INTEGER NOT NULL,
	PRIMARY KEY (`AuditID`)
);
CREATE TABLE `LibraryCompany` (
	`CompanyID` INTEGER NOT NULL AUTO_INCREMENT,
	`CompanyName` VARCHAR(100) NOT NULL,
	`Address` VARCHAR(100),
	`City` VARCHAR(50),
	`State` VARCHAR(2),
	`ZIPCode` VARCHAR(10),
	`Country` VARCHAR(3),
	`Phone` VARCHAR(50),
	`PhoneNotes` VARCHAR(100),
	`Email` VARCHAR(100),
	`WebSite` VARCHAR(100),
	`Comments` TEXT,
	PRIMARY KEY (`CompanyID`)
);
CREATE TABLE `LibraryHandbellEnsemble` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibraryItemKeyword` (
	`LibraryItem` INTEGER NOT NULL,
	`LibraryKeyword` INTEGER NOT NULL,
	PRIMARY KEY (`LibraryItem`, `LibraryKeyword`)
);
CREATE TABLE `LibraryItemTag` (
	`LibraryItem` INTEGER NOT NULL,
	`LibraryTag` INTEGER NOT NULL,
	PRIMARY KEY (`LibraryItem`, `LibraryTag`)
);
CREATE TABLE `LibraryKey` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibraryKeyword` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(50) NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`),
	UNIQUE (`LookupValue`)
);
CREATE TABLE `LibraryOwner` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibraryPerson` (
	`PersonID` INTEGER NOT NULL AUTO_INCREMENT,
	`LastName` VARCHAR(50) NOT NULL,
	`FirstName` VARCHAR(50),
	`Dates` VARCHAR(50),
	`Comments` TEXT,
	`SearchKey` VARCHAR(200) NOT NULL,
	PRIMARY KEY (`PersonID`)
);
CREATE TABLE `LibrarySeason` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibrarySkill` (
	`LookupID` INTEGER NOT NULL AUTO_INCREMENT,
	`LookupValue` VARCHAR(255) NOT NULL,
	`SortPosition` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`LookupID`)
);
CREATE TABLE `LibraryTag` (
	`TagID` INTEGER NOT NULL AUTO_INCREMENT,
	`TagGroup` INTEGER NOT NULL,
	`TagName` VARCHAR(50) NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`TagID`)
);
CREATE TABLE `LibraryTagGroup` (
	`TagGroupID` INTEGER NOT NULL AUTO_INCREMENT,
	`TagGroupName` VARCHAR(255) NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`TagGroupID`),
	UNIQUE (`TagGroupName`)
);
CREATE TABLE login_account (
	account_id INTEGER NOT NULL AUTO_INCREMENT,
	account_name VARCHAR(50) NOT NULL,
	account_fullname VARCHAR(50) NOT NULL,
	account_password VARCHAR(50) NOT NULL,
	account_readonly INTEGER NOT NULL,
	account_status ENUM('Active','Inactive') NOT NULL,
	account_comment VARCHAR(512),
	account_admin INTEGER NOT NULL,
	account_hash VARCHAR(255),
	PRIMARY KEY (account_id),
	UNIQUE (account_name)
);
CREATE TABLE login_session (
	sess_id VARCHAR(36) NOT NULL,
	sess_user VARCHAR(50) NOT NULL,
	sess_last INTEGER NOT NULL,
	sess_start DATETIME NOT NULL,
	sess_closed DATETIME,
	PRIMARY KEY (sess_id)
);
CREATE TABLE report_request (
	request_id INTEGER NOT NULL AUTO_INCREMENT,
	account VARCHAR(50),
	requested DATETIME,
	parameters TEXT,
	elapsed FLOAT,
	PRIMARY KEY (request_id)
);
CREATE TABLE `LibraryItem` (
	`ItemID` INTEGER NOT NULL AUTO_INCREMENT,
	`ItemTitle` VARCHAR(100) NOT NULL,
	`OtherTitle` VARCHAR(100),
	`IsCollection` VARCHAR(1) NOT NULL,
	`ComposerID` INTEGER,
	`LyricistID` INTEGER,
	`ArrangerID` INTEGER,
	`PublisherID` INTEGER,
	`SupplierID` INTEGER,
	`AccompanimentID` INTEGER,
	`ArrangementID` INTEGER,
	`KeyID` INTEGER,
	`SkillID` INTEGER,
	`SopranoID` INTEGER,
	`AltoID` INTEGER,
	`TenorID` INTEGER,
	`BassID` INTEGER,
	`SeasonID` INTEGER,
	`OwnerID` INTEGER,
	`HandbellEnsembleID` INTEGER,
	`CollectionID` INTEGER,
	`PageNumber` VARCHAR(32),
	`StockNumber` VARCHAR(100),
	`Copyright` VARCHAR(50),
	`Duration` FLOAT,
	`TimeSignature` VARCHAR(50),
	`ProgramNotes` TEXT,
	`Comments` TEXT,
	`SortKey` VARCHAR(512) NOT NULL,
	`ComposerSortKey` VARCHAR(512) NOT NULL,
	`ArrangerSortKey` VARCHAR(512) NOT NULL,
	`DateAdded` DATETIME,
	`AddedBy` VARCHAR(20),
	`DateModified` DATETIME,
	`ModifiedBy` VARCHAR(20),
	PRIMARY KEY (`ItemID`),
	FOREIGN KEY(`ComposerID`) REFERENCES `LibraryPerson` (`PersonID`),
	FOREIGN KEY(`LyricistID`) REFERENCES `LibraryPerson` (`PersonID`),
	FOREIGN KEY(`ArrangerID`) REFERENCES `LibraryPerson` (`PersonID`),
	FOREIGN KEY(`PublisherID`) REFERENCES `LibraryCompany` (`CompanyID`),
	FOREIGN KEY(`SupplierID`) REFERENCES `LibraryCompany` (`CompanyID`),
	FOREIGN KEY(`AccompanimentID`) REFERENCES `LibraryAccompaniment` (`LookupID`),
	FOREIGN KEY(`ArrangementID`) REFERENCES `LibraryArrangement` (`LookupID`),
	FOREIGN KEY(`KeyID`) REFERENCES `LibraryKey` (`LookupID`),
	FOREIGN KEY(`SkillID`) REFERENCES `LibrarySkill` (`LookupID`),
	FOREIGN KEY(`SopranoID`) REFERENCES `LibrarySkill` (`LookupID`),
	FOREIGN KEY(`AltoID`) REFERENCES `LibrarySkill` (`LookupID`),
	FOREIGN KEY(`TenorID`) REFERENCES `LibrarySkill` (`LookupID`),
	FOREIGN KEY(`BassID`) REFERENCES `LibrarySkill` (`LookupID`),
	FOREIGN KEY(`SeasonID`) REFERENCES `LibrarySeason` (`LookupID`),
	FOREIGN KEY(`OwnerID`) REFERENCES `LibraryOwner` (`LookupID`),
	FOREIGN KEY(`HandbellEnsembleID`) REFERENCES `LibraryHandbellEnsemble` (`LookupID`),
	FOREIGN KEY(`CollectionID`) REFERENCES `LibraryItem` (`ItemID`)
);
CREATE TABLE `LibraryInventory` (
	`InventoryID` INTEGER NOT NULL AUTO_INCREMENT,
	`LibraryItem` INTEGER NOT NULL,
	`InStock` INTEGER,
	`InStockDate` DATE,
	`StorageLocation` VARCHAR(100),
	`LatestPrice` DECIMAL(8, 2),
	`AcquireCondition` VARCHAR(100),
	`Comments` TEXT,
	PRIMARY KEY (`InventoryID`),
	FOREIGN KEY(`LibraryItem`) REFERENCES `LibraryItem` (`ItemID`)
);
CREATE TABLE `LibraryLoan` (
	`LoanID` INTEGER NOT NULL AUTO_INCREMENT,
	`LibraryItem` INTEGER NOT NULL,
	`LoanRecipient` VARCHAR(128) NOT NULL,
	`LoanDate` DATE NOT NULL,
	`LoanReturned` DATE,
	`Comments` TEXT,
	PRIMARY KEY (`LoanID`),
	FOREIGN KEY(`LibraryItem`) REFERENCES `LibraryItem` (`ItemID`)
);
CREATE TABLE `LibraryPart` (
	`PartID` INTEGER NOT NULL AUTO_INCREMENT,
	`LibraryItem` INTEGER NOT NULL,
	`PartName` VARCHAR(100),
	`InventoryDate` DATE,
	`OnHand` INTEGER,
	`Needed` INTEGER,
	`OnOrder` INTEGER,
	`Loaned` INTEGER,
	`Comments` TEXT,
	PRIMARY KEY (`PartID`),
	FOREIGN KEY(`LibraryItem`) REFERENCES `LibraryItem` (`ItemID`)
);
CREATE TABLE `LibraryPerformance` (
	`PerformanceID` INTEGER NOT NULL AUTO_INCREMENT,
	`PerformanceDate` DATE NOT NULL,
	`LibraryItem` INTEGER NOT NULL,
	`Comments` TEXT,
	PRIMARY KEY (`PerformanceID`),
	FOREIGN KEY(`LibraryItem`) REFERENCES `LibraryItem` (`ItemID`)
);
