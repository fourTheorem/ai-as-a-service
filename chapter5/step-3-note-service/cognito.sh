# CAVEAT only works for single id pool and user pool i.e. clean account as per book
#!/bin/bash
. ./.env
. checkenv.sh

case $1 in
  setup)
    echo '#>>'>>.env
    export CHAPTER4_POOL_ID=`aws cognito-idp list-user-pools --max-results 1 | jq -r '.UserPools | .[0].Id'`
    echo CHAPTER4_POOL_ID=$CHAPTER4_POOL_ID>>.env

    export CHAPTER4_POOL_ARN=`aws cognito-idp describe-user-pool --user-pool-id $CHAPTER4_POOL_ID | jq -r '.UserPool.Arn'`
    echo CHAPTER4_POOL_ARN=$CHAPTER4_POOL_ARN>>.env

    export CHAPTER4_IDPOOL=`aws cognito-identity list-identity-pools --max-results 1 | jq -r '.IdentityPools | .[0].IdentityPoolId'`
    echo CHAPTER4_IDPOOL=$CHAPTER4_IDPOOL>>.env

    export CHAPTER4_POOL_CLIENT_ID=`aws cognito-idp list-user-pool-clients --user-pool-id $CHAPTER4_POOL_ID | jq -r '.UserPoolClients | .[0].ClientId'`
    echo CHAPTER4_POOL_CLIENT_ID=$CHAPTER4_POOL_CLIENT_ID>>.env

    export CHAPTER4_COGNITO_DOMAIN=$CHAPTER4_COGNITO_BASE_DOMAIN.auth.eu-west-1.amazoncognito.com
    echo CHAPTER4_COGNITO_DOMAIN=$CHAPTER4_COGNITO_DOMAIN>>.env
    echo '#<<'>>.env

    aws cognito-idp create-user-pool-domain --domain $CHAPTER4_COGNITO_BASE_DOMAIN --user-pool-id $CHAPTER4_POOL_ID

    aws cognito-idp update-user-pool-client --user-pool-id $CHAPTER4_POOL_ID --client-id $CHAPTER4_POOL_CLIENT_ID\
     --supported-identity-providers "COGNITO"\
     --callback-urls "[\"https://s3-${TARGET_REGION}.amazonaws.com/${CHAPTER4_BUCKET}/index.html\"]"\
     --logout-urls "[\"https://s3-${TARGET_REGION}.amazonaws.com/${CHAPTER4_BUCKET}/index.html\"]"\
     --allowed-o-auth-flows "implicit"\
     --allowed-o-auth-scopes "email" "openid" "aws.cognito.signin.user.admin"\
     --allowed-o-auth-flows-user-pool-client
  ;;
  teardown)
    aws cognito-idp delete-user-pool-domain --domain $CHAPTER4_COGNITO_BASE_DOMAIN --user-pool-id $CHAPTER4_POOL_ID
  ;;
  *)
    echo 'nope'
  ;;
esac
