const {parentPort} = require("worker_threads");

parentPort.on("message", data => {
  const nums = data.nums;
  for (let i = data.start; i < data.stop; i++) {
     const n = nums[i];
     const res = fibonnaci(n);
     Atomics.store(nums, i, res);  // thread-safe
     parentPort.postMessage({num: n, fib: res});
  }
})

function fibonnaci(num) {
    if (num === 0) {
        return 0;
    } else if (num === 1) {
        return 1;
    } else {
        return fibonnaci(num - 1) + fibonnaci(num - 2);
    }
}

