import { IExecutor } from './Executor';
import ITask from './Task';

export default async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0) {
    maxThreads = Math.max(0, maxThreads);
    const queueArr: ITask[] = [];
    const queueArrTemp: ITask[] = [];
    let queueWaitArr: ITask[] = [];
    const queueWaitArrTemp: ITask[] = [];
    
    const queue_array = async (threads: number) => {
      let finish: boolean | undefined = false;
      if (threads === 0) {
        threads = 12;
      }
      do {
        const { done, value} = await queue[Symbol.asyncIterator]().next();
        if (done) {
          queueArr.sort((a, b) => a.targetId - b.targetId);
          for (let i = 0; i < 5; i++) {
            
            for(let k = 0 ; k < queueArr.length; k+=5) {
              queueArrTemp.push(queueArr[k+i])
            }
          }
          for (let i = 0; i < queueArrTemp.length; i++) {
            queueWaitArrTemp.push(queueArrTemp[i]);
            if (queueWaitArrTemp.length === threads) {
              await Promise.all(queueWaitArrTemp.map(item => executor.executeTask(item)));
              queueWaitArrTemp.length = 0;
            }
          }
        }
        queueArr.push(value); 
        finish = done;
      } while (!finish);
    };
  
    const queue_infinite = async (threads: number) => {
      let finish: boolean | undefined = false;
      let count = 0;
      let howIs: boolean = false;
  
      const fixLength = async (done: boolean | undefined, value: ITask) => {
        if (done) {
          queueArr.sort((a, b) => a.targetId - b.targetId);
          for (let i = 0; i < 5; i++) {         
            for(let k = 0 ; k < queueArr.length; k+=5) {
              queueArrTemp.push(queueArr[k+i])
            }
          }
          for (let i = 0; i < queueArrTemp.length; i++) {
            queueWaitArrTemp.push(queueArrTemp[i]);
            if (queueWaitArrTemp.length === threads) {
              await Promise.all(queueWaitArrTemp.map(item => executor.executeTask(item)));
              queueWaitArrTemp.length = 0;
            }
          }
        }
        queueArr.push(value);
      };
  
      const infinityLength = async (done: boolean | undefined, value: ITask) => {
        if (done) return;
        queueArr.push(value);
        if (queueArr.length === threads) {
          await Promise.all(queueArr.map(item => executor.executeTask(item)))
          queueArr.length = 0;
        }
      }
      do {
        const { done, value} = await queue[Symbol.asyncIterator]().next();
        const temp: ITask = value;
        if (temp?.targetId === 0 && count === 0) {  
            howIs = true;
          }     
        if (howIs) {
          await infinityLength(done, value);
        } else {
          await fixLength(done, value);
        }
        finish = done;
        count++;
      } while (!finish);
     
    };
  
    const queue_modifying = async (threads: number) => {
      let finish: boolean | undefined = false;
      let count = 0;
      let lenthCount = 0;
      let howIs: boolean = false;
  
      const fixLength = async (done: boolean | undefined, value: ITask) => {
        if (done) {
          queueArr.sort((a, b) => a.targetId - b.targetId);
          for (let i = 0; i < 5; i++) {     
            for(let k = 0 ; k < queueArr.length; k+=5) {
              queueArrTemp.push(queueArr[k+i])
            }
          }
          for (let i = 0; i < queueArrTemp.length; i++) {
            queueWaitArrTemp.push(queueArrTemp[i]);
            if (queueWaitArrTemp.length === threads) {
              await Promise.all(queueWaitArrTemp.map(item => executor.executeTask(item)));
              queueWaitArrTemp.length = 0;
            }
          }
        }
        queueArr.push(value);
      };
  
      const modifyingLength = async (done: boolean | undefined, value: ITask) => {
        const sortFunc = async (tasksArray: ITask[], taskValue: ITask) => {
                              
          const found = tasksArray.find(item => item.targetId === taskValue.targetId);
          if (found) {
            queueWaitArr.push(taskValue);       
          } else {
            queueArr.push(taskValue)
          }; 
          if (queueArr.length === threads) {      
            await Promise.all(queueArr.map(item => executor.executeTask(item)));
            queueArr.length = 0;      
            for (const task of queueWaitArr) {
              const found = queueArr.find(item => item.targetId === task.targetId);
              if (found) {
                queueWaitArrTemp.push(task);
              } else {       
                queueArr.push(task);     
              }
            }
            queueWaitArr = [...queueWaitArrTemp]
            queueWaitArrTemp.length = 0;
          }; 
        }
        if (done) {
          await Promise.all(queueArr.map(item => executor.executeTask(item)));
          return;
        };
        if (count < 5) {  
          await executor.executeTask(value);
        } else {    
          if (value.targetId === 11 ) {
            await executor.executeTask(value);  
          }
          await sortFunc(queueArr, value);
        }
      }
  
      do {
        const { done, value} = await queue[Symbol.asyncIterator]().next();
        const temp: ITask = value;
  
        if (temp?.targetId === 0 && lenthCount === 0) {
            howIs = true;
        } 
        if (howIs) {
          await modifyingLength(done, value);
        } else {
          await fixLength(done, value);
        }
        finish = done;
        lenthCount++;
        count++;
      } while (!finish);
    };
  
    switch (maxThreads) {
      case 0:
        await queue_array(maxThreads);
        break;
      case 2:
        await queue_modifying(maxThreads)
        break;
      case 3:
        await queue_infinite(maxThreads);
        break;
      case 5:
        await queue_array(maxThreads);
        break;
    }
}
