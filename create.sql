CREATE TABLE stock (
    name            varchar(80),
    code            varchar(5),
    price           real,
    timestamp       timestamp
);


CREATE TABLE temperature (
    name            varchar(80),
    temperature    	real,
    location        point,
    timestamp       timestamp
);