# CAVEAT only works for single id pool and user pool i.e. clean account as per book
#!/bin/bash
. ./.env
. checkenv.sh

case $1 in
  setup)
    echo '#>>'>>.env
    export CHAPTER3_POOL_ID=`aws cognito-idp list-user-pools --max-results 1 | jq -r '.UserPools | .[0].Id'`
    echo CHAPTER3_POOL_ID=$CHAPTER3_POOL_ID>>.env

    export CHAPTER3_POOL_ARN=`aws cognito-idp describe-user-pool --user-pool-id $CHAPTER3_POOL_ID | jq -r '.UserPool.Arn'`
    echo CHAPTER3_POOL_ARN=$CHAPTER3_POOL_ARN>>.env

    export CHAPTER3_IDPOOL=`aws cognito-identity list-identity-pools --max-results 1 | jq -r '.IdentityPools | .[0].IdentityPoolId'`
    echo CHAPTER3_IDPOOL=$CHAPTER3_IDPOOL>>.env

    export CHAPTER3_POOL_CLIENT_ID=`aws cognito-idp list-user-pool-clients --user-pool-id $CHAPTER3_POOL_ID | jq -r '.UserPoolClients | .[0].ClientId'`
    echo CHAPTER3_POOL_CLIENT_ID=$CHAPTER3_POOL_CLIENT_ID>>.env

    export CHAPTER3_COGNITO_DOMAIN=$CHAPTER3_COGNITO_BASE_DOMAIN.auth.eu-west-1.amazoncognito.com
    echo CHAPTER3_COGNITO_DOMAIN=$CHAPTER3_COGNITO_DOMAIN>>.env
    echo '#<<'>>.env

    aws cognito-idp create-user-pool-domain --domain $CHAPTER3_COGNITO_BASE_DOMAIN --user-pool-id $CHAPTER3_POOL_ID

    aws cognito-idp update-user-pool-client --user-pool-id $CHAPTER3_POOL_ID --client-id $CHAPTER3_POOL_CLIENT_ID\
     --supported-identity-providers "COGNITO"\
     --callback-urls "[\"https://s3-${TARGET_REGION}.amazonaws.com/${CHAPTER3_BUCKET}/index.html\"]"\
     --logout-urls "[\"https://s3-${TARGET_REGION}.amazonaws.com/${CHAPTER3_BUCKET}/index.html\"]"\
     --allowed-o-auth-flows "implicit"\
     --allowed-o-auth-scopes "email" "openid" "aws.cognito.signin.user.admin"\
     --allowed-o-auth-flows-user-pool-client
  ;;
  teardown)
    aws cognito-idp delete-user-pool-domain --domain $CHAPTER3_COGNITO_BASE_DOMAIN --user-pool-id $CHAPTER3_POOL_ID
  ;;
  *)
    echo 'nope'
  ;;
esac
