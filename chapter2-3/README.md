# Chapter 2
This folder containes the code for Chapter2.

## Deploy and remove
If your AWS account is setup and and you have configured the following environment variables in your shell:

```sh
AWS_ACCOUNT_ID
AWS_DEFAULT_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
CHAPTER2_BUCKET
CHAPTER2_DOMAIN
```

Then the system can be deployed using:

```
$ bash ./deploy.sh
```

The system can be reomved using:

```
$ bash ./remove.sh
```

