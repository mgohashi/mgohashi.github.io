## Installing and configuring Knative

After having the CRC up and running, let's install the version `2.8` of the *3scale Operator*. The process that we will go here is using the `kubectl` command-line interface (CLI).

```shell
$ kubectl get packagemanifests/3scale-operator \
     -n openshift-marketplace -o yaml | yq r - \
     "status.channels[*].name" --collect
- threescale-2.6
- threescale-2.7
- threescale-2.8
```

The command above returned all the supported channels that we are going to use. For the purpose of this test, we will pick the latest version channel `threescale-2.8` which will result in the following command to add the subscription in our Kubernetes.

3scale operator can not be installed to run in a clusterwide mode, instead we need to create a specific namespace for it to run. So, let's create the namespace `3scale28`.

```shell
$ kubectl create ns 3scale28
```

Now we can create our subscription inside this namespace.

```shell
$ cat << EOF | kubectl apply -f - 
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: 3scale-operator
  namespace: 3scale28
spec:
  channel: threescale-2.8
  name: 3scale-operator
  source: redhat-operators
  sourceNamespace: openshift-marketplace
  startingCSV: 3scale-operator.v0.5.2
EOF
```

This 

```shell
cat << EOF | kubectl apply -f -                                   
apiVersion: apps.3scale.net/v1alpha1
kind: APIManager
metadata:
  name: my-apimanager
spec:
  productVersion: "2.8"
  wildcardDomain: apps-crc.testing
  resourceRequirementsEnabled: true
EOF
```