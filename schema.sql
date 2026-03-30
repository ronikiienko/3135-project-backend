CREATE TABLE user
(
    id              int AUTO_INCREMENT,
    PRIMARY KEY (id),
    email           varchar(255) NOT NULL,
    password_hash   varchar(255) NOT NULL,
    avatar_filename varchar(255),
    is_deleted      boolean      DEFAULT false
) COLLATE utf8mb4_general_ci;

CREATE TABLE user_image
(
    filename varchar(255),
    PRIMARY KEY (filename),
    user_id  int NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE TABLE shelter
(
    id              int AUTO_INCREMENT,
    PRIMARY KEY (id),
    name            varchar(255) NOT NULL,
    is_verified     boolean      DEFAULT false,
    location        varchar(255) NOT NULL,
    description     text         NOT NULL,
    rating          decimal(3, 2),
    suspended_until datetime,
    FOREIGN KEY (id) REFERENCES user (id)
);

CREATE TABLE renter
(
    id              int AUTO_INCREMENT,
    PRIMARY KEY (id),
    fName           varchar(100) NOT NULL,
    lName           varchar(100) NOT NULL,
    location        varchar(255) NOT NULL,
    description     text         NOT NULL,
    rating          decimal(3, 2),
    suspended_until datetime,
    FOREIGN KEY (id) REFERENCES user (id)
);

CREATE TABLE admin
(
    id                int AUTO_INCREMENT,
    PRIMARY KEY (id),
    name              varchar(255) NOT NULL,
    can_create_admins boolean      DEFAULT false,
    FOREIGN KEY (id) REFERENCES user (id)
);

CREATE TABLE admin_token
(
    token_hash varchar(255),
    PRIMARY KEY (token_hash),
    expires_at datetime NOT NULL
);

CREATE TABLE listing
(
    id          int AUTO_INCREMENT,
    PRIMARY KEY (id),
    shelter_id  int           NOT NULL,
    FOREIGN KEY (shelter_id) REFERENCES shelter (id) ON UPDATE CASCADE ON DELETE CASCADE,
    name        varchar(100)  NOT NULL,
    species     varchar(100)  NOT NULL,
    age         tinyint       NOT NULL,
    description text          NOT NULL,
    is_closed   boolean       DEFAULT false,
    rate        decimal(10, 2) NOT NULL
);

CREATE TABLE listing_image
(
    filename   varchar(255),
    PRIMARY KEY (filename),
    listing_id int NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listing (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE rental
(
    id                    int AUTO_INCREMENT,
    PRIMARY KEY (id),
    shelter_id            int NOT NULL,
    FOREIGN KEY (shelter_id) REFERENCES shelter (id) ON UPDATE CASCADE ON DELETE CASCADE,
    renter_id             int NOT NULL,
    FOREIGN KEY (renter_id) REFERENCES renter (id) ON UPDATE CASCADE ON DELETE CASCADE,
    listing_id            int NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listing (id) ON UPDATE CASCADE ON DELETE CASCADE,
    assigned_admin_id     int,
    FOREIGN KEY (assigned_admin_id) REFERENCES admin (id) ON UPDATE CASCADE ON DELETE SET NULL,
    rental_begins         datetime,
    rental_ends           datetime,
    terms_proposed_at     datetime,
    status                enum (
        'REQUESTED',
        'SHELTER_DECLINED',
        'PAYMENT_PENDING',
        'PAYMENT_EXPIRED',
        'RENTER_DECLINED',
        'SHELTER_WITHDREW',
        'PAID',
        'DISPUTE',
        'PEACEFULLY_TERMINATED',
        'DISPUTE_IN_FAVOR_OF_SHELTER',
        'DISPUTE_IN_FAVOR_OF_RENTER',
        'SHELTER_CANCELLED'
    )                     NOT NULL,
    dispute_reason        text,
    total_cost            decimal(10, 2),
    stripe_transaction_id varchar(255)
);

CREATE TABLE report
(
    id          int AUTO_INCREMENT,
    PRIMARY KEY (id),
    reporter_id int,
    FOREIGN KEY (reporter_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE SET NULL,
    reported_id int NOT NULL,
    FOREIGN KEY (reported_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    body        text         NOT NULL,
    reason      varchar(255) NOT NULL,
    is_resolved boolean      DEFAULT false
);

CREATE TABLE message
(
    id           int AUTO_INCREMENT,
    PRIMARY KEY (id),
    sender_id    int NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    recipient_id int,
    FOREIGN KEY (recipient_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at   timestamp DEFAULT CURRENT_TIMESTAMP,
    body         text      NOT NULL
);

CREATE TABLE review
(
    id          int AUTO_INCREMENT,
    PRIMARY KEY (id),
    reviewer_id int,
    FOREIGN KEY (reviewer_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE SET NULL,
    reviewed_id int NOT NULL,
    FOREIGN KEY (reviewed_id) REFERENCES user (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    body        text          NOT NULL,
    score       decimal(3, 2) NOT NULL
);
