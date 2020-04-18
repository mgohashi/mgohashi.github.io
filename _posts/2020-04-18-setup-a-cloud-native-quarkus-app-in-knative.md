---
title:  "Quick Start Knative"
excerpt: "This post will show you details on how to provision, deploy and use some Knative features and give you an overview of what is serverless"
header:
  overlay_image: /assets/images/unsplash-image-1.jpg
  overlay_filter: 0.5
  caption: "Photo credit: [**Unsplash**](https://unsplash.com)"
toc: true
categories: 
 - Blog
 - Kubernetes
 - Knative
tags: 
 - Kubernetes
 - Openshift4
 - Knative
 - Cloud Native
 - Quarkus
 - Container
 - Serverless
 - Code Ready Containers
 - kubectl
 - Maven
 - Java11
---


In this article, I am going to show you how to deploy a *Cloud-Native Application* in *Knative.* There are several advantages that we could use to make better usage of resources of your Kubernetes cluster.

*Knative[^1]* is a Kubernetes native platform built to deploy and manage serverless workloads. Knative was created by Google with the contribution of several companies, such as IBM, SAP, Red Hat, Pivotal, and others. It has some capabilities, such as scale to zero, stand up, a pluggable architecture, and it can be used with almost every kind of application.

A *Cloud-Native Application[^2]* is a sort of application that uses technologies that run smoothly in a cloud environment and have implemented some requirements that would not only make it more reliable in dynamic environments, but also in platforms, such as Kubernetes, which I would include: health checks, circuit breakers, bulkhead patterns, and so on.

In order to deploy and test our serverless setup in a Kubernetes environment we will use the *Code Ready Containers* (CRC) environment. Code Ready Containers will spin up a cluster, which is an all-in-one cluster or both master and worker node, in your local machine. So, if you don't have it already there you can follow the installation process in this link [here](https://code-ready.github.io/crc/#installation_gsg){:target="_blank"}.

## Installing and configuring Knative

After having the CRC up and running, let's install the *Openshift Serverless Operator* witch is based on the version `0.13.1` of Knative. The process that we will go here is using the `oc` command-line interface (CLI).

```shell
$ kubectl get packagemanifests/serverless-operator \
     -n openshift-marketplace -o yaml | yq r - \
     "status.channels[*].name" --collect
preview-4.3
techpreview
```

The command above returned all the supported channels that we are going to use. For the purpose of this test, we will pick the channel `preview-4.3` which will result in the following command to add the subscription in our Kubernetes.

```shell
$ cat << EOF | kubectl apply -f - 
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: serverless-operator
  namespace: openshift-operators 
spec:
  channel: preview-4.3
  name: serverless-operator
  source: redhat-operators 
  sourceNamespace: openshift-marketplace 
EOF
```

To install `KnativeServing` we must create it inside a `knative-serving` namespace.

```shell
$ cat << EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
 name: knative-serving
---
apiVersion: operator.knative.dev/v1alpha1
kind: KnativeServing
metadata:
 name: knative-serving
 namespace: knative-serving
EOF
```

You can validate the installation by running the following command and see all the operator's pods running.

```shell
$ kubectl get pods -n knative-serving
```

You can see in the output that there are two `controllers` for this basic installation.

```shell
NAME                             READY   STATUS    RESTARTS   AGE
activator-5c7cd46767-6gdqj       1/1     Running   0          5m13s
autoscaler-b8b4cb4b5-d79cg       1/1     Running   0          5m12s
autoscaler-hpa-86ccbc78d-7wvdn   1/1     Running   0          5m2s
autoscaler-hpa-86ccbc78d-f4ptr   1/1     Running   0          5m2s
controller-695597996-xxgls       1/1     Running   0          5m11s
controller-695597996-z6x6g       1/1     Running   0          5m11s
webhook-76bb99f856-wlclf         1/1     Running   0          5m10s
```

The controllers will be scanning all CR's that we will be creating throughout the article.

## Creating the Cloud-native application

To create the Cloud-native application we will use the current GA version of [Quarkus framework](https://quarkus.io){:target="_blank"}.

To create this application you need to have the following versions:
 - [GraalVM](https://www.graalvm.org/){:target="_blank"} 19.3.1 or 20.0.0 for native compilation
 - [Apache Maven](https://maven.apache.org/){:target="_blank"} 3.6.2+

So, let's create our application by using `io.quarkus:quarkus-maven-plugin:1.3.2.Final` plugin.

```shell
$ mvn io.quarkus:quarkus-maven-plugin:1.3.2.Final:create \
      -DgroupId=io.mohashi.sample \
      -DartifactId=quickstart-knative \
      -DclassName=io.mohashi.sample.resource.ProductResource \
      -Dpath="/v1/api/product"
```

The previous command is going to create `quickstart-knative` folder with the following contents inside:

```console
quickstart-knative
├── mvnw
├── mvnw.cmd
├── pom.xml
├── README.md
└── src
    ├── main
    │   ├── docker
    │   │   ├── Dockerfile.jvm
    │   │   └── Dockerfile.native
    │   ├── java
    │   │   └── io
    │   │       └── mohashi
    │   │           └── sample
    │   │               └── resource
    │   │                   └── ProductResource.java
    │   └── resources
    │       ├── application.properties
    │       └── META-INF
    │           └── resources
    │               └── index.html
    └── test
```
 - `mvnw and mvnw.cmd`: Maven command
 - `Dockerfile.jvm`: Dockerfile used to build the Quarkus app in JVM mode
 - `Dockerfile.native`: Dockerfile used to build the Quarkus app in native mode
 - `ProductResource.java`: Class that implements a JAX-RS resource
 - `application.properties`: A configuration file for the Quarkus app


Now that we've created the app you can run it using the following command:

**NOTE:** This command also keeps watching your source code for any changes and when detected these changes are automatically compiled and your application reloaded. So, after you run it, you can leave it there running to take all the changes we will make here.
{: .notice--info}

```shell
$ ./mvn clean quarkus:dev
```

That will open the port `8080` on your local machine to access your new Cloud-native application. Try to open the application in your preferred browser by accessing [http://localhost:8080](http://localhost:8080){:target="_blank"}.

![Cloud-native-app](/assets/images/quakus-app-web-browser.png)

You can also use the [`httpie`](http://httpie.org){:target="_blank"} command to test the default service created at `localhost:8080/v1/api/product`.

```shell
$ http localhost:8080/v1/api/product
HTTP/1.1 200 OK
Content-Length: 5
Content-Type: text/plain;charset=UTF-8

hello
```

After creating the application, we can start improving its endpoints. For the sake of simplicity, I will create a POJO `Product` as our model inside a package `io.mohashi.sample.model`.

```java
package io.mohashi.sample.model;

import java.math.BigDecimal;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class Product {
    public Integer id;
    public String name;
    public String sku;
    public BigDecimal value;

    public Product() {
    }

    public Product(Integer id, String name, 
        String sku, BigDecimal value) {
        this.id = id;
        this.name = name;
        this.sku = sku;
        this.value = value;
    }
}
```
 - `@RegisterForReflection`: This annotation makes this class eligible for reflection event after we generate the native binary for this class.

**Note** 
At the moment, when JSON-B or Jackson tries to get the list of fields of a class, if the class is not registered for reflection, no exception will be thrown. GraalVM will simply return an empty list of fields.<br/>
Hopefully, this will change in the future and make the error more obvious.
{: .notice}


Let's change a little bit the JAX-RS endpoint to return a list of objects of `Product`.

```java
package io.mohashi.sample.resource;

import io.mohashi.sample.model.Product;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.math.BigDecimal;
import java.util.LinkedList;
import java.util.List;

@Path("/v1/api/product")
public class ProductResource {

    private List<Product> products;

    public ProductResource() {
        products = new LinkedList<>();
        products.add(new Product(1, "Laptop", 
            "P00001", new BigDecimal(10)));
        products.add(new Product(2, "Keyboard", 
            "P00002", new BigDecimal(20)));
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public Response list() {
        return Response.ok(products).build();
    }
}
```

**Note**: Don't forget to fix the unit tests after changing the resource.
{: .notice--info}

In order to add features to a Quarkus application we use *extensions*. Extensions are just pluggable components that can be added to a Quarkus app. A Quarkus application comes out-of-the-box with a minimal set of extensions `quarkus-resteasy` and `quarkus-junit5`. So, we will add some new extensions that will provide the functionalities that we will need in this example. And here follows:
 - `resteasy-jsonb`: To provide automatic JSON object mapping conversion;
 - `openshift`: To provide Knative support for our application;
 - `smallrye-health`: To enable health checks in the cluster;

To add an extension to our Quarkus application we will use the plugin `quarkus-maven-plugin`.

```shell
$ ./mvnw quarkus:add-extension \
     -Dextensions="resteasy-jsonb, openshift, smallrye-health"
```

The result is:

```
...
[INFO] --- quarkus-maven-plugin:1.3.2.Final:add-extension (default-cli) @ quickstart-knative ---
✅ Adding extension io.quarkus:quarkus-smallrye-health
✅ Adding extension io.quarkus:quarkus-openshift
✅ Adding extension io.quarkus:quarkus-resteasy-jsonb
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  2.456 s
[INFO] Finished at: 2020-04-17T12:14:51-03:00
[INFO] ------------------------------------------------------------------------
```

Now that we've added the extensions let's check our endpoint again.

```shell
$ http localhost:8080/v1/api/product
```

The result is:

```http
HTTP/1.1 200 OK
Content-Length: 105
Content-Type: application/json

[
    {
        "id": 1,
        "name": "Laptop",
        "sku": "P00001",
        "value": 10
    },
    {
        "id": 2,
        "name": "Keyboard",
        "sku": "P00002",
        "value": 20
    }
]
```

## Deploying in Knative

So, now that we have our bare minimal application built let's move on to deploy it into our Kubernete instance. But, we need to prepare the configuration files with additional properties:

```properties
quarkus.container-image.registry=image-registry.openshift-image-registry.svc:5000
quarkus.container-image.group=knative-app
quarkus.kubernetes.deployment-target=knative
```
 - `quarkus.container-image.registry`: This property is to inform from where the Knative is going to retrieve the container image
 - `quarkus.container-image.group`: This property informs the namespace that the deployment is going to be created
 - `quarkus.kubernetes.deployment-target`: This property informs the `quarkus-maven-plugin` what is going to be our deployment target platform

And then, let's create a new namespace `knative-app` for our deployment.

```shell
$ kubectl create namespace knative-app
```

And let's set the current namespace to `knative-app`.

```shell
$ kubectl config set-context --current --namespace=knative-app
```

We are going to need a container image repository for that. For the sake of simplicity, we are going to use the CRC's internal repository.

```shell
$ ./mvnw clean package -Dquarkus.container-image.build=true \
    -Dquarkus.kubernetes-client.trust-certs=true -DskipTests \
    -Pnative
```
 - `native`: the native profile makes the build process to generate a native compilation using GraalVM

The result is long and you should see the image being pushed to the repository:

```shell
...
[INFO] [io.quarkus.container.image.s2i.deployment.S2iProcessor] Writing manifest to image destination
[INFO] [io.quarkus.container.image.s2i.deployment.S2iProcessor] Storing signatures
[INFO] [io.quarkus.container.image.s2i.deployment.S2iProcessor] Successfully pushed image-registry.openshift-image-registry.svc:5000/knative-app/quickstart-knative@sha256:cbefd02c096002aaf0718b61299280825d392c866ddd03e933a58399b1980ea2
[INFO] [io.quarkus.container.image.s2i.deployment.S2iProcessor] Push successful
[INFO] [io.quarkus.deployment.QuarkusAugmentor] Quarkus augmentation completed in 137493ms
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  02:22 min
[INFO] Finished at: 2020-04-17T12:19:19-03:00
[INFO] ------------------------------------------------------------------------
```

Now that we have there the image there we will be able to create the deployment of the Knative service.

**Small fix for `quarkus.maven.plugin` version `1.3.2.Final`**<br/>
This fix is necessary due to a newer mandatory [Knative's protocol requirement](https://github.com/knative/serving/blob/master/docs/runtime-contract.md#protocols-and-ports){:target="_blank"}. And the latest quarkus-maven-plugin is not fully compliant. So, to fix that we will need to manually rename a container port from `http` to `http1` and remove the liveness and readiness ports from probes in the generated file `target/kubernetes/knative.yml`, before deploying it.
{: .notice--warning}

```shell
$ kubectl apply -f ./target/kubernetes/knative.yml
```

As a result you are going to see the resources being created and the pods starting up.

```console
serviceaccount/quickstart-knative created
service.serving.knative.dev/quickstart-knative created
```

The list of pods that will appear in your console

```console
NAME                                                   READY   STATUS      RESTARTS   AGE
quickstart-knative-1-build                             0/1     Completed   0          29m
quickstart-knative-t5xgf-deployment-76f5d67bfd-jr5gt   2/2     Running     0          51s
```

**Note** If we wait for 90 seconds you will see that the pod is going to terminate due to the scale to zero feature of knative.
{: .notice--info}

```console
quickstart-knative-...-jr5gt   2/2     Terminating   0          90s
quickstart-knative-...-jr5gt   2/2     Terminating   0          111s
quickstart-knative-...-jr5gt   2/2     Terminating   0          112s
quickstart-knative-...-jr5gt   0/2     Terminating   0          112s
quickstart-knative-...-jr5gt   0/2     Terminating   0          112s
quickstart-knative-...-jr5gt   0/2     Terminating   0          2m2s
quickstart-knative-...-jr5gt   0/2     Terminating   0          2m2s
```

Once we deploy our app and the app runs smoothly knative creates an ingress to our application and a deployment. You can check using the following command:

```shell
$ kubectl get route.serving/quickstart-knative
```

The output will be:

```console
NAME                 URL                                                      READY   REASON
quickstart-knative   http://quickstart-knative.knative-app.apps-crc.testing   True    
```

So, this is our ingress route to the Knative app. Let's test it.

```shell
$ http $(kc get route.serving/quickstart-knative -o yaml | yq r - 'status.url')/v1/api/product
```

After making this call you should see the application starting up in the Kubernete cluster:

```console
NAME                           READY   STATUS              RESTARTS   AGE
quickstart-knative-...-9cx58   0/2     Pending             0          0s
quickstart-knative-...-9cx58   0/2     Pending             0          0s
quickstart-knative-...-9cx58   0/2     ContainerCreating   0          0s
quickstart-knative-...-9cx58   0/2     ContainerCreating   0          2s
quickstart-knative-...-9cx58   1/2     Running             0          4s
quickstart-knative-...-9cx58   2/2     Running             0          17s
```
And you can see the deployment count incrementing by one:

```console
NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
quickstart-knative-t5xgf-deployment   0/1     1            0           85m
quickstart-knative-t5xgf-deployment   1/1     1            1           86m
```

After a few seconds we can see the application response comming out:

```http
HTTP/1.1 200 OK
Cache-control: private
Set-Cookie: 79c0449662bd552659559da2f83e5009=036dc4d7b97d7c3b08ba671fa1a966bb; path=/; HttpOnly
content-length: 105
content-type: application/json
date: Fri, 17 Apr 2020 17:11:57 GMT
server: envoy
x-envoy-upstream-service-time: 6775

[
    {
        "id": 1,
        "name": "Laptop",
        "sku": "P00001",
        "value": 10
    },
    {
        "id": 2,
        "name": "Keyboard",
        "sku": "P00002",
        "value": 20
    }
]
```

And after 90 seconds the deployment is updated again:

```console
NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
quickstart-knative-t5xgf-deployment   1/1     1            1           86m
quickstart-knative-t5xgf-deployment   1/0     1            1           87m
quickstart-knative-t5xgf-deployment   1/0     1            1           87m
quickstart-knative-t5xgf-deployment   0/0     0            0           87m
```

In the web console you can see the update happening as well.

{% include video id="KyCbkXF3Qpw" provider="youtube" %}

## Conclusion

With this introductory article, we have created a Cloud-native application and deployed in a Knative Ready Kubernetes Cluster. Knative applications are good to optimize hardware utilization and save money and resources just when it is really necessary. Regardless, we need to understand that this comes with the price that these kinds of applications need to be very lightweight and fast startup time.

Stay tuned for more articles related to developing Cloud-native apps.

You can see this sample code in the following repository: [https://github.com/mgohashi/quickstart-knative](https://github.com/mgohashi/quickstart-knative){:target="_blank"}.

[^1]: [knative.dev](https://knative.dev/){:target="_blank"}
[^2]: [Developing Cloud Native Applications](https://www.cncf.io/blog/2017/05/15/developing-cloud-native-applications/){:target="_blank"}
