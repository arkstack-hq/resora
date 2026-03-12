# Resource

Handles transformation of a single resource.

## Constructor

```ts
new Resource(resource, response?)
```

### Parameters

| Parameter | Type                        | Description       |
| --------- | --------------------------- | ----------------- |
| resource  | ResourceData                | Data to transform |
| response  | Express Response (optional) | Auto-send support |

---

## Methods

### data()

Returns the flattened resource.

```ts
resource.data();
```

---

### toObject()

Returns the transformed data without wrapping in `{ data }`.

```ts
resource.toObject();
```

---

### additional(extra)

Merge additional properties into the response body.

```ts
resource.additional({
  status: 'success',
  message: 'User created',
});
```

---

### response()

Returns a [`ServerResponse`](../api/server-response.md) instance.

```ts
resource.response();
```

---

### Promise Support

Resource is promise-like.

```ts
await new Resource(user, res);
```

or

```ts
new Resource(user, res).then((body) => {
  console.log(body);
});
```
