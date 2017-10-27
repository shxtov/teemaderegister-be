# teemaderegister-be

Node.js Server with MongoDB for topic registry for TLU

.env
```
MONGODB_URI=mongodb://host:port/db

# recommended expiration 24h = 60 * 60 * 24 = 86400
TOKEN_EXPIRES_IN_SECONDS=86400

# recommended update every hour 60 * 60 
TOKEN_UPDATE_IN_SECONDS=3600

PORT=3000

EMAIL=app@app.ee
DEV_EMAIL=app@app.ee

NODE_ENV=development

LOG_LEVEL=7

APP_NAME=app

```

Development
```
nodemon --debug bin/www
```
