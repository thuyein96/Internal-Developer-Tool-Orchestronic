#!/bin/bash

# K3s Ingress Troubleshooting Script
# Run this on the K3s master node

echo "=== K3s Ingress Troubleshooting ==="
echo

# 1. Check cluster status
echo "1. Cluster Status:"
kubectl get nodes -o wide
echo

# 2. Check ingress controller
echo "2. Traefik Ingress Controller Status:"
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
kubectl get svc -n kube-system traefik
echo

# 3. Check ingress resources
echo "3. Ingress Resources:"
kubectl get ingress --all-namespaces
echo

# 4. Check services
echo "4. Services (NodePort):"
kubectl get svc --all-namespaces | grep NodePort
echo

# 5. Check your app's deployment
echo "5. Your App Status:"
kubectl get deployment,pods,svc -n default | grep -i app
echo

# 6. Test NodePort connectivity
echo "6. NodePort Connectivity Test:"
SVC_NAME=""
if kubectl -n kube-system get svc traefik >/dev/null 2>&1; then
    SVC_NAME="traefik"
else
    SVC_NAME=$(kubectl -n kube-system get svc -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' \
        | grep -E '^traefik($|[-])' | head -n1 || true)
fi

if [ -z "$SVC_NAME" ]; then
    echo "Could not find a Traefik Service in kube-system" >&2
    exit 1
fi

NODEPORT=$(kubectl get svc "$SVC_NAME" -n kube-system -o jsonpath='{.spec.ports[?(@.name=="web")].nodePort}')
WORKER_IP=$(kubectl get nodes -o jsonpath='{.items[?(@.metadata.labels.role!="master")].status.addresses[?(@.type=="InternalIP")].address}' | head -1)

if [ ! -z "$NODEPORT" ] && [ ! -z "$WORKER_IP" ]; then
    echo "Testing: $WORKER_IP:$NODEPORT"
    curl -I --connect-timeout 5 http://$WORKER_IP:$NODEPORT || echo "❌ Failed to connect to NodePort"
else
    echo "❌ Could not determine NodePort or Worker IP"
fi
echo

# 7. Test ingress directly
echo "7. Ingress Test:"
INGRESS_HOST=$(kubectl get ingress -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null)
if [ ! -z "$INGRESS_HOST" ]; then
    echo "Testing ingress host: $INGRESS_HOST"
    curl -I --connect-timeout 5 -H "Host: $INGRESS_HOST" http://localhost:80 || echo "❌ Failed to connect via ingress"
else
    echo "❌ No ingress found"
fi
echo

# 8. Check Traefik dashboard
echo "8. Traefik Dashboard Access:"
echo "Dashboard should be available at: http://<MASTER_IP>:8080/dashboard/"
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik -o wide
echo

# 9. Show events
echo "9. Recent Events:"
kubectl get events --sort-by='.lastTimestamp' | tail -10
echo

echo "=== Troubleshooting Complete ==="
