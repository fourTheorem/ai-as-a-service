# Chapter 5 - Step 2
Secured to do application.

## Deploy and remove
If your AWS account is setup and and you have configured the following environment variables in your shell:

```sh
AWS_ACCOUNT_ID
AWS_DEFAULT_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

And you have created a .env file in this directory containg

```
TARGET_REGION=eu-west-1
CHAPTER4_BUCKET=<YOUR BUCKET NAME>
CHAPTER4_DATA_BUCKET=<YOUR DATA BUCKET NAME>
CHAPTER4_DOMAIN=<YOUR CUSTOM DOMAIN>
CHAPTER4_COGNITO_BASE_DOMAIN=<BASE COGNITO DOMAIN>
```

Then the system can be deployed using:

```
$ bash ./deploy.sh
```

access using:

```
https://${CHAPTER4_BUCKET}.s3.amazonaws.com/index.html
```

The system can be reomved using:

```
$ bash ./remove.sh
```

