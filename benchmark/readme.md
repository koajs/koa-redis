Benchmark

=============

## ENV

```
OS X 10.9

node v0.11.9
redis v2.6.4

connect@2.12.0
connect-redis@1.4.6

koa@0.1.2
koa-sess@0.0.4
koa-redis@0.0.2
```

## Report

```
siege -b -c 50 -t 1M
```

|Server|Transaction rate|Response time|
|------|----------------|-------------|
|connect without session|**6763.56 trans/sec**|**0.01 secs**|
|koa without session|**5684.75 trans/sec**|**0.01 secs**|
|connect with session|**2759.70 trans/sec**|**0.02 secs**|
|koa with session|**2355.38 trans/sec**|**0.02 secs**|

### Without Session

```
# siege connect
$ siege -b -c 50 -t 1M http://localhost:8081
** SIEGE 2.72
** Preparing 50 concurrent users for battle.
The server is now under siege...
Lifting the server siege...      done.

Transactions:         402229 hits
Availability:         100.00 %
Elapsed time:          59.47 secs
Data transferred:         4.99 MB
Response time:            0.01 secs
Transaction rate:      6763.56 trans/sec
Throughput:           0.08 MB/sec
Concurrency:           49.94
Successful transactions:      402229
Failed transactions:             0
Longest transaction:          0.03
Shortest transaction:         0.00

#siege koa
$ siege -b -c 50 -t 1M http://localhost:8080
** SIEGE 2.72
** Preparing 50 concurrent users for battle.
The server is now under siege...
Lifting the server siege...      done.

Transactions:         336992 hits
Availability:         100.00 %
Elapsed time:          59.28 secs
Data transferred:         2.89 MB
Response time:            0.01 secs
Transaction rate:      5684.75 trans/sec
Throughput:           0.05 MB/sec
Concurrency:           49.96
Successful transactions:      336992
Failed transactions:             0
Longest transaction:          0.03
Shortest transaction:         0.00

```

### With Session

```

#siege connect
$ siege -b -c 50 -t 1M http://localhost:8081
** SIEGE 2.72
** Preparing 50 concurrent users for battle.
The server is now under siege...
Lifting the server siege...      done.

Transactions:         165527 hits
Availability:         100.00 %
Elapsed time:          59.98 secs
Data transferred:         2.05 MB
Response time:            0.02 secs
Transaction rate:      2759.70 trans/sec
Throughput:           0.03 MB/sec
Concurrency:           49.97
Successful transactions:      165527
Failed transactions:             0
Longest transaction:          0.08
Shortest transaction:         0.01

#siege koa
$ siege -b -c 50 -t 1M http://localhost:8080
** SIEGE 2.72
** Preparing 50 concurrent users for battle.
The server is now under siege...
Lifting the server siege...      done.

Transactions:         139368 hits
Availability:         100.00 %
Elapsed time:          59.17 secs
Data transferred:         1.20 MB
Response time:            0.02 secs
Transaction rate:      2355.38 trans/sec
Throughput:           0.02 MB/sec
Concurrency:           49.97
Successful transactions:      139368
Failed transactions:             0
Longest transaction:          0.04
Shortest transaction:         0.01
```
