## General

Every endpoint in this specification describes payload and response schemas using Zod javascript library schemas.
https://zod.dev/api
While this is not PHP native, this has advantages:
- frontend can directly use these types
- these Zod types are quite descriptive and contain more information than just the type (e.g. string, number) as they
can also include constraints (e.g. min length, max length, regex patterns). 

For example, endpoint describes that
```typescript
const payloadSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.string().email(),
})
```
Backend must ensure that the payload received from the client follows this schema. 
This is more secure, and very importantly catches bugs and disrepancies between frontend and backend early.
This will save our time and effort.

Frontend will also validate its own payload AND will validate responses from the backend.

Most endpoints will have response variant that corresponds to validation errors. 
Our approach is that backend's IS NOT responsible for telling what exactly is wrong in payload. Backend is responsible for
REJECTING requests with malformed payloads. Yes, short password or invalid email also falls under malformed payloads.

Missing url param is also considered malformed payload.

You are not expected to manually check every field in payload and write if statements for them.
Instead you should use some zod alternative for PHP.
Different PHP libraries exist to achieve this, such as "respect/validation" or "rakit/validation" and other.

You can validate responses from backend in the same way.

Some go as far as validate results of database queries against schemas too, 
because it's easy to make a mistake in database query and return wrong data.

Also, each endpoint will have different variants of response.
Existence of "error" field in response will indicate that the request was unsuccessful.
I came up with possible error reasons in every endpoint and wrote them down. I may have missed some or made some mistake.
But generally if you see an error reason then you should handle it.
"error" field is NOT free form text. It is error code that frontend should be able to programatically handle using if/switch.
If you found new edge case that is not covered you should tell me.

Moreover, every response variant has HTTP status code. Backend should adhere to these status codes.

INTERNAL_SERVER error is fallback for any unexpected errors that may occur on backend.

Some endpoints will use multipart form data format (unlike other that just use json).
In these cases form data will have:
- "metadata" field - stringified JSON that adheres to the payload schema defined in this specification
- any files will have their own fields as defined in the specification

In any endpoints that receive files, you should never use original filename to store file on backend.
Always generate a new unique filename to prevent filename collisions

Difference between "UNAUTHENTICATED" and "FORBIDDEN" errors is that UNAUTHENTICATED means that user is not logged in, 
while FORBIDDEN means that user is logged in but doesn't have permissions to perform this action.

FORBIDDEN error can be returned for various reasons: no ownership of resource, not verified, not correct role, etc. 
You should critically think about other edge cases where FORBIDDEN should be returned and make sure to cover them. I may have missed some.

Common API types are defined here:
```typescript
const idSchema = z.number();
const timestampSchema = z.iso.datetime();
const moneySchema = z.number().min(0); // monetary value in USD
const passwordSchema = z.string().min(8);
// We should store it as 0 to 1 float even if we display it as start
// this simplified out logic and makes it more consistent.
// frontend will do necessary conversions to display it as star rating if needed.
const ratingSchema = z.number().min(0).max(1);
const roleSchema = z.enum(["SHELTER", "RENTER", "ADMIN"]);

const userSchema = z.object({
    id: idSchema,
    email: z.email(),
    password: passwordSchema,
    avatar_filename: z.string().nullable(),
    profile_images: z.array(z.string()),
    is_deleted: z.boolean(),
});

const adminSchema = userSchema.extend({
    name: z.string(),
    can_create_admins: z.boolean(),
});

const shelterSchema = userSchema.extend({
    name: z.string(),
    is_verified: z.boolean(),
    location: z.string(),
    description: z.string(),
    rating: ratingSchema.nullable(),
    suspended_until: timestampSchema.nullable(),
});

const renterSchema = userSchema.extend({
    fName: z.string(),
    lName: z.string(),
    location: z.string(),
    description: z.string(),
    rating: ratingSchema.nullable(),
    suspended_until: timestampSchema.nullable(),
});

const listingSchema = z.object({
    id: idSchema,
    shelter_id: idSchema,
    name: z.string(),
    species: z.string(),
    age: z.number(),
    description: z.string(),
    is_closed: z.boolean(),
    rate: moneySchema, // hourly rate in USD
    created_at: timestampSchema,
    shelter_name: z.string(),
    listing_images: z.array(z.string()),
});

const rentalStatusSchema = z.enum([
    // when renter initiates rental
    "REQUESTED",
    // shelter declined request. 
    "SHELTER_DECLINED",
    // shelter accepted and proposed terms (timeperiod in this case).
    // renter can pay at any time before the rental start date.
    // time period must start in the future and end after it begins
    "PAYMENT_PENDING",
    // renter did not pay before rental_begins passed. transitioned by cron job.
    "PAYMENT_EXPIRED",
    "RENTER_DECLINED", // renter declined shelter's proposed terms
    "SHELTER_WITHDREW", // shelter withdrew from rental after accepting it but before renter paid
    "PAID", // rental paid (final acceptance of rental terms by renter)
    "DISPUTE", // when renter creates dispute for rental
    "PEACEFULLY_TERMINATED", // When rental period ends and there are no disputes in 24 hours after rental end time
    "DISPUTE_IN_FAVOR_OF_SHELTER", // when admin resolves dispute in favor of shelter
    "DISPUTE_IN_FAVOR_OF_RENTER", // when admin resolves dispute in favor of renter
    // shelter may discover that they can't provide pet (e.g emergency, animal got sick etc.)
    // after renter already paid for rental.
    // cancellation only applies after rental is paid and means that money goes back to renter
    "SHELTER_CANCELLED",
    // renter cancels their own request before shelter has accepted or declined it.
    // no payment involved.
    "RENTER_CANCELLED",
]);



const rentalSchema = z.object({
    id: idSchema,
    shelter_id: idSchema,
    renter_id: idSchema,
    listing_id: idSchema,
    listing_name: z.string(),
    renter_name: z.string(),
    shelter_name: z.string(),
    assigned_admin_id: idSchema.nullable(),
    rental_begins: timestampSchema.nullable(),
    rental_ends: timestampSchema.nullable(),
    terms_proposed_at: timestampSchema.nullable(),
    status: rentalStatusSchema,
    dispute_reason: z.string().nullable(),
    total_cost: moneySchema.nullable(),
    stripe_transaction_id: z.string().nullable(),
    closed_at: timestampSchema.nullable(), // set when rental reaches a terminal status
});

const messageSchema = z.object({
    id: idSchema,
    sender_id: idSchema,
    recepient_id: idSchema,
    created_at: timestampSchema,
    body: z.string(),
});

const adminTokenSchema = z.object({
    token: z.string(),
    expires_at: timestampSchema,
});


const reportSchema = z.object({
    id: idSchema,
    reporter_id: idSchema,
    reported_id: idSchema,
    body: z.string(),
    reason: z.string(),
    is_resolved: z.boolean(),
});

const reviewSchema = z.object({
    id: idSchema,
    reviewer_id: idSchema,
    reviewed_id: idSchema,
    body: z.string(),
    score: ratingSchema,
});
```

## Endpoints

## Auth

### POST /auth/login
Not authenticated. 

Roles allowed: all.

Logic: establishes session for user. We need to allow using same email for
different roles, role is provided in payload to differentiate.
Basically find if user that:
- has this email
- has this role
- is not deleted
- has this password

exists. If he does, create session for him. If not, return error.

Payload:
```typescript
const payloadSchema = z.object({
    email: z.email(),
    password: passwordSchema,
    role: roleSchema,
})
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        user: z.union([
            shelterSchema.omit({ password: true }),
            renterSchema.omit({ password: true }),
            adminSchema.omit({ password: true }),
        ]),
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 401
    z.object({
        error: z.literal("INVALID_CREDENTIALS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### POST /auth/logout
Authenticated.
Roles allowed: all.
Logic: destroys session for user.
Payload: 
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### POST /auth/registerShelter
Not authenticated.
Roles allowed: all.
Logic: registers shelter user and creates session for them. 
Ensure that email is not already used by another non-deleted shelter. It's OK if it's used by renter or admin.
Multipart form data

Payload:
```typescript
const payloadSchema = shelterSchema.omit({
    id: true,
    rating: true,
    is_verified: true,
    avatar_filename: true,
    profile_images: true,
    is_deleted: true,
    suspended_until: true,
})
```
Files:
- "avatar" - single file, optional
- "profile_images" - multiple files, optional

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        shelter: shelterSchema.omit({
            password: true,
        }),
    }),
    // status: 409
    z.object({
        error: z.literal("EMAIL_ALREADY_IN_USE")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### POST /auth/registerRenter 
Not authenticated.
Roles allowed: all.
Logic: registers renter user and creates session for them.
Ensure that email is not already used by another non-deleted renter. It's OK if it's used by shelter or admin.
Multipart form data

Payload:
```typescript
const payloadSchema = renterSchema.omit({
    id: true,
    rating: true,
    avatar_filename: true,
    profile_images: true,
    is_deleted: true,
    suspended_until: true,
})
```

Files:
- "avatar" - single file, optional
- "profile_images" - multiple files, optional

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        renter: renterSchema.omit({
            password: true,
        }),
    }),
    // status: 409
    z.object({
        error: z.literal("EMAIL_ALREADY_IN_USE")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### POST /auth/registerAdmin
Authenticated by admin token.

Logic: checks if admin token is valid. If it is, registers admin user and creates session for them.
Ensure that email is not already used by another non-deleted admin. It's OK if it's used by shelter or renter.

Multipart form data

Payload:
```typescript
const payloadSchema = adminSchema.omit({
    id: true,
    avatar_filename: true,
    profile_images: true,
    is_deleted: true,
})
```

Files:
- "avatar" - single file, optional
- "profile_images" - multiple files, optional

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        admin: adminSchema.omit({
            password: true,
        }),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 409
    z.object({
        error: z.literal("EMAIL_ALREADY_IN_USE")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

## Admin

### POST /admin/createAdminToken
Authenticated.

Roles allowed: admin

Logic: creates admin token and stores it along with its expiration time.
Admin must have can_create_admins permission to create admin tokens.
Admin must be not deleted

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        adminToken: z.string(),
        expiresAt: timestampSchema
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```



### GET /admin/shelters
Authenticated.

Roles allowed: admin

Logic: returns all non-deleted shelters.
Admin must be not deleted.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        shelters: z.array(shelterSchema.omit({ password: true })),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### PATCH /admin/verifyShelter?shelterId=
Authenticated.

Roles allowed: admin

Logic: verifies shelter. Only unverified shelters can be verified.
Admin must be not deleted

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("SHELTER_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("SHELTER_ALREADY_VERIFIED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

## Rental

### POST /renter/initiateRental?listingId=
Authenticated.

Roles allowed: renter.

Logic: initiates rental for listing. Should create rental with "REQUESTED" status.
We do NOT enforce that there are no other rentals for the same listing from different renters.
Only not deleted renters can initiate rentals (add check everywhere for not deleted users).
Listing must not be closed (if closed, then forbidden)
Forbidden if renter is suspended.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        rental: rentalSchema,
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("LISTING_NOT_FOUND")
    }),
    // status 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### PATCH /shelter/respondToRentalRequest?rentalId=
Authenticated.

Roles allowed: shelter.

Logic: shelter responds to rental request with either confirmation + suggested time period or denial. Only shelter that owns listing can respond to rental request.
Only VERIFIED shelters can respond to rental requests.
Only not deleted shelters can respond to rental requests.
We do NOT enforce that there are no overlaps in time periods with other rentals for same listing.
Only works if rental is in "REQUESTED" status.
Switches status to "PAYMENT_PENDING" or "SHELTER_DECLINED" depending on shelter's response.
When CONFIRM: suggestedRentalBegins must be in the future, and suggestedRentalEnds must be after suggestedRentalBegins. Otherwise PAYLOAD_MALFORMED.

Payload:
```typescript
const payloadSchema = z.object({
    response: z.literal("CONFIRM"),
    suggestedRentalBegins: timestampSchema,
    suggestedRentalEnds: timestampSchema,
}).or(z.object({
    response: z.literal("DENY"),
}))
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
])
```

### PATCH /shelter/widthdrawFromRental?rentalId=
Authenticated.

Roles allowed: shelter.

Logic: shelter withdraws from rental after accepting it but before renter paid. Only shelter that belongs to rental can withdraw from it.
Only VERIFIED shelters can withdraw from rentals.
Only not deleted shelters can withdraw from rentals 
Should only work if rental is in "PAYMENT_PENDING" status. Switches rental status to "SHELTER_WITHDREW".

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### PATCH /renter/respondToRentalTerms?rentalId=
Authenticated.

Roles allowed: renter.

Logic: renter either accepts proposed rental terms or declines. 
Will include payment information when we implement payments.
Only renter that belongs to rental can respond to rental terms.
Only not deleted renters can respond to rental terms.
Only works if rental is in "PAYMENT_PENDING" status.
Switches rental status to "PAID" or "RENTER_DECLINED" depending on renter's response.
Only works if it's been less than 24 hours since shelter proposed rental terms.
After 24 hours it's considered "wrong rental status"


Payload:
```typescript
const payloadSchema = z.object({
    response: z.literal("ACCEPT"),
    // payment information will go here when we implement payments
}).or(z.object({
    response: z.literal("DECLINE"),
}))
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### PATCH /renter/cancelRentalRequest?rentalId=
Authenticated.

Roles allowed: renter.

Logic: renter cancels their own rental request before the shelter has responded. No payment is involved.
Only the renter that belongs to the rental can cancel it.
Only not deleted renters can cancel rental requests.
Only works if rental is in "REQUESTED" status.
Switches rental status to "RENTER_CANCELLED" and sets closed_at = NOW().

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### PATCH /shelter/cancelRental?rentalId=
Authenticated.

Roles allowed: shelter.

Logic: cancel rental. Only shelter who belongs to rental can cancel it.
Only VERIFIED shelters can cancel rentals.
Only not deleted shelters can cancel rentals
Only works if rental is in "PAID" status.
Switches rental status to "SHELTER_CANCELLED" and money goes back to renter.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### PATCH /rental/dispute?rentalId=
Authenticated.

Roles allowed: renter.

Logic: create dispute for rental. Only the renter that belongs to the rental can open a dispute.
Only not deleted renters can dispute rentals.
Only rentals in "PAID" status can be disputed.
Switches rental status to "DISPUTE" and sets dispute reason.

Payload:
```typescript
const payloadSchema = z.object({
    reason: z.string(),
});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### PATCH /admin/assignDispute?rentalId=
Authenticated.

Roles allowed: admin.

Logic: assigns admin (who makes request) to dispute. Only disputes that are in "DISPUTE" status and don't have assigned admin can be assigned.
If there's already an assigned admin, it's considered "wrong rental status". Only non deleted admin

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401  
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### PATCH /admin/resolveDispute?rentalId=
Authenticated.

Roles allowed: admin

Logic: resolves dispute for rental. 
Only rentals in "DISPUTE" status can be resolved.
Only assigned admin can resolve dispute.
Money should go to either shelter or renter depending on resolution.
Rental status should be updated to either "DISPUTE_IN_FAVOR_OF_SHELTER" or "DISPUTE_IN_FAVOR_OF_RENTER".

Payload:
```typescript
const payloadSchema = z.object({
    resolution: z.enum(["IN_FAVOR_OF_SHELTER", "IN_FAVOR_OF_RENTER"]),
});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 409
    z.object({
        error: z.literal("WRONG_RENTAL_STATUS")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```

### GET /rentals
Authenticated.

Roles allowed: renter or shelter

Logic: returns all rentals belonging to renter or shelter depending who on requests.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        rentals: z.array(rentalSchema),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### GET /rental
Authenticated.

Roles allowed: shelter or renter

Logic: returns a single rental by ID. The requesting user must own the rental (shelter_id or renter_id must match session user).

Payload:
```typescript
const payloadSchema = z.object({
    rentalId: z.number(),
});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        rental: rentalSchema,
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTAL_NOT_FOUND")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### GET /admin/rentals
Authenticated.

Roles allowed: admin

Logic: returns all rentals.
Can add filtering/pagination later if needed. Now just return all rentals.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        rentals: z.array(rentalSchema),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### Periodic code 
Backend should run periodic code that:
- Moves rental with "PAYMENT_PENDING" status to "PAYMENT_EXPIRED" if it's been more than 24 hours since shelter proposed rental and renter didn't pay
- Moves rentals with "PAID" status to "PEACEFULLY_TERMINATED" if it's been more than 24 hours since rental end time

## Review

### POST /review/createReview?reviewedId=
Authenticated.

Roles allowed: shelter or renter

Logic: creates a review for shelter or renter depending on who is making request.
Currently we do not enforce that review can only be created after rental is completed
need to ensure that user with reviewedId exists and has correct role (forbidden if not correct role).
Because renter can only review shelter and shelter can only review renter.
Only non deleted users can review.
but, ALLOW reviewing deleted users

Payload:
```typescript
const payloadSchema = reviewSchema.omit({
    id: true,
    reviewer_id: true,
    reviewed_id: true,
})
```

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        review: reviewSchema,
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("REVIEWED_USER_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### GET /reviews?reviewedId=
Authenticated.

Roles allowed: all

Logic: returns all reviews for shelter or renter depending on reviewedId.
If reviewedId belongs to admin just return empty array of reviews because admin cannot be reviewed.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        reviews: z.array(reviewSchema),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 404
    z.object({
        error: z.literal("REVIEWED_USER_NOT_FOUND")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### PATCH /review?reviewId=
NOT A PRIORITY FOR NOW

### DELETE /review?reviewId=
NOT A PRIORITY FOR NOW

## Messaging

### POST /message/send?recipientId=
Authenticated.

Roles allowed: all

Logic: sends message to recipient. Only recipient that exists can receive message.
This endpoint is FORBIDDEN for suspended users.
Allow sending messages to suspended users.
Forbid sending messages to deleted users

Payload:
```typescript
const payloadSchema = z.object({
    body: z.string(),
});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        message: messageSchema,
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("RECIPIENT_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### GET /messages?correspondentId=
Authenticated.

Roles allowed: all

Logic: returns all messages between user and correspondent. 
Only correspondent that exists can be used.
No pagination for now, just return all messages.
Allow getting messages with suspended users.
Allow getting messages with deleted users.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        messages: z.array(messageSchema),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 404
    z.object({
        error: z.literal("CORRESPONDENT_NOT_FOUND")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

## Report

### POST /report/createReport?reportedId=
Authenticated.

Roles allowed: renter or shelter

Logic: creates a report for shelter or renter depending on who is making request.
Just like in /createReview endpoint, we do not enforce that report can only be created after rental exists.
And just like in /createReview endpoint, we need to ensure that user with reportedId exists and has correct role (forbidden if not correct role).
Correct role = opposite of the one who is making request
Forbid reporting admins
Forbid reporting deleted users, but allow reporting suspended users.

Payload:
```typescript
const payloadSchema = reportSchema.omit({
    id: true,
    reporter_id: true,
    reported_id: true,
    status: true,
})
```

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        report: reportSchema,
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("REPORTED_USER_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### GET /reports 
Authenticated.

Roles allowed: admin

Logic: returns all reports. Can add filtering/pagination later if needed, but for now just return all reports.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        reports: z.array(reportSchema),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
])
```

### PATCH /admin/resolveReport?reportId=
Authenticated.

Roles allowed: admin

Logic: resolves report. 
Only reports that are not resolved can be resolved.
Suspension time in this request overrides previous suspension time.
User who this request suspends must not be deleted, but can be suspended (oveeride)
Won't implement assignment of admin to report. IT'S TOO MUCH ALREADY

Payload:
```typescript
const payloadSchema = z.object({
    resolution: z.enum(["SUSPEND_USER", "DISMISS_REPORT"]),
    suspend_until: timestampSchema.nullable(), 
});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    z.object({
        error: z.literal("REPORT_NOT_FOUND")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
])
```



## Listing

### POST /shelter/createListing
Authenticated.

Roles allowed: shelter.

Logic: creates listing for shelter
Only VERIFIED shelters can create listings.
Only not suspended shelters can create listings.

Multipart form data

Payload:
```typescript
const payloadSchema = listingSchema.omit({
    id: true,
    shelter_id: true,
    is_closed: true,
    listing_images: true,
})
```

Files:
- "listing_images" - multiple files, optional

Response:
```typescript
const responseSchema = z.union([
    // status: 201
    z.object({
        listing: listingSchema,
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### POST /shelter/closeListing?listingId=
Authenticated.

Roles allowed: shelter.

Logic: closes listing. Only shelter that owns listing can close it. Listing
can be closed even if it has active rentals. Only VERIFIED shelters can close listings.
Closing listing will not affect active rentals, but it will prevent creating new rentals for this listing.
Closing listing is irreversible action.
Suspended shelters are allowed to close listings.

Payload:
```typescript
const payloadSchema = z.object({})
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 404
    // listing doesn't exist
    z.object({
        error: z.literal("LISTING_NOT_FOUND")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### PATCH /shelter/listing?listingId=
NOT A PRIORITY FOR NOW

### GET /listing?listingId=
Authenticated.

Roles allowed: all

Logic: returns a single listing by id. Returns 404 if not found.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        listing: listingSchema,
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 404
    z.object({
        error: z.literal("LISTING_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### GET /listings
Authenticated.

Roles allowed: all

Logic: returns all listings. Can add filtering/pagination later if needed, but for now just return all listings.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        listings: z.array(listingSchema),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

## Shelter

### GET /shelter/me
Authenticated.

Roles allowed: shelter.

Logic: returns shelter's own profile.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        shelter: shelterSchema.omit({
            password: true,
        }),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### PATCH /shelter/me
NOT A PRIORITY FOR NOW

## Renter

### GET /renter/me
Authenticated.

Roles allowed: renter.

Logic: returns renter's own profile.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        renter: renterSchema.omit({
            password: true,
        }),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### PATCH /renter/me
NOT A PRIORITY FOR NOW

## Admin 

### GET /admin/me
Authenticated.

Roles allowed: admin.

Logic: returns admin's own profile.

Payload:
```typescript
const payloadSchema = z.object({});
```
Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        admin: adminSchema.omit({
            password: true,
        }),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 403
    z.object({
        error: z.literal("FORBIDDEN")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### PATCH /admin/me
NOT A PRIORITY FOR NOW

## Profiles

### GET /shelter/profile?shelterId=
Authenticated.

Roles allowed: all

Logic: returns public profile of shelter. Works for deleted and suspended shelters too.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        shelter: shelterSchema.omit({ password: true, email: true, is_deleted: true, suspended_until: true }),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 404
    z.object({
        error: z.literal("SHELTER_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

### GET /renter/profile?renterId=
Authenticated.

Roles allowed: all

Logic: returns public profile of renter. Works for deleted and suspended renters too.

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({
        renter: renterSchema.omit({ password: true, email: true, is_deleted: true, suspended_until: true }),
    }),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 404
    z.object({
        error: z.literal("RENTER_NOT_FOUND")
    }),
    // status: 400
    z.object({
        error: z.literal("PAYLOAD_MALFORMED")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```

## Image serving

### GET /uploads?filename=
Not authenticated (we don't have any sensitive images)

Logic: serves image with filename.
All images are stored in same uploads folder


## User deletion

### DELETE /me
Authenticated.

Roles allowed: all

Logic: deletes user's own account.
Sets is_deleted to true.
Deletion is not allowed if user has active rental, which means one of following status:
- "REQUESTED"
- "PAYMENT_PENDING"
- "PAID"
- "DISPUTE"

Additionally, if user is shelter, close all listings
All ongoing reports opened for this user will be automatically marked resolved

Session should be destroyed after this

Payload:
```typescript
const payloadSchema = z.object({});
```

Response:
```typescript
const responseSchema = z.union([
    // status: 200
    z.object({}),
    // status: 401
    z.object({
        error: z.literal("UNAUTHENTICATED")
    }),
    // status: 409
    z.object({
        error: z.literal("USER_HAS_ACTIVE_RENTAL")
    }),
    // status: 500
    z.object({
        error: z.literal("INTERNAL_SERVER")
    }),
]);
```













