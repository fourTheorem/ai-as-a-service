# Chapter 3 - Step 1
Unsecured to do application.

## Deploy and remove
If your AWS account is setup and and you have configured the following environment variables in your shell:

``sh
AWS_ACCOUNT_ID
AWS_DEFAULT_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

And you have created a .env file in this directory containg

```
TARGET_REGION=eu-west-1
CHAPTER3_BUCKET=<YOUR BUCKET NAME>
CHAPTER3_DATA_BUCKET=<YOUR DATA BUCKET NAME>
CHAPTER3_DOMAIN=<YOUR CUSTOM DOMAIN>
```

Then the system can be deployed using:

```
$ bash ./deploy.sh
```

The system can be reomved using:

```
$ bash ./remove.sh
```

