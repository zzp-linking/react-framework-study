import { compareTowVdom, findDOM } from "./react-dom";
// 更新队列
export let updateQueue = {
  isBatchingUpdate: false, // 默认值是非批量的,同步的
  updaters: [], // 更新器的数组
  batchUpdate () {
    for (let updater of updateQueue.updaters) {
      updater.updateComponent()
    }
    updateQueue.updaters.length = 0
    updateQueue.isBatchingUpdate = false
  }
}
class Updater {
  constructor(classInstance) {
    this.classInstance = classInstance
    this.pendingState = [] // 等待更新的数组
    // this.callbacks = []
  }
  addState (partialState) {
    this.pendingState.push(partialState)
    this.emitUpdate() // 触发更新
  }
  emitUpdate () {
    // 有可能是批量异步更新，也有可能是同步更新
    if (updateQueue.isBatchingUpdate) { // 批量异步更新
      updateQueue.updaters.push(this) // 不刷新组件视图了，只是把自己这个updater实例添加到updateQueue里面等待生效
    } else { // 同步直接更新
      this.updateComponent()
    }

  }
  updateComponent () {
    const { classInstance, pendingState } = this
    if (pendingState.length > 0) {
      shouldUpdate(classInstance, this.getState())
    }
  }
  // 获取最新状态
  getState () {
    const { classInstance, pendingState } = this
    let { state } = classInstance // number: 0 老状态
    pendingState.forEach(partialState => { // 每个分状态
      // 如果是函数，更改时是基于上一个状态
      if (typeof partialState === 'function') {
        partialState = partialState(state)
      }
      state = { ...state, ...partialState }
    })
    pendingState.length = 0 // 清空等待生效的状态 的数组
    return state
  }
}

function shouldUpdate (classInstance, nextSatae) {
  classInstance.state = nextSatae // 先把新状态复制给实例的State
  classInstance.forceUpdate()
}


class Component {
  static isClassComponent = true // 当子类继承父类的时候，父类的静态属性也是可以继承的
  constructor (props) {
    this.props = props
    this.state = {}
    this.updater = new Updater(this)
  }
  setState (partialState) {
    this.updater.addState(partialState)
  }
  // 根据新的属性状态，计算新的要渲染的虚拟DOM
  forceUpdate () {
    console.log('Component forceUpdate')
    let oldRenderVdom = this.oldRenderVdom // 上一次类逐渐render方法计算得到的虚拟DOM
    let oldDOM = findDOM(oldRenderVdom) // 获取oldRenderVdom 对应的真实DOM
    let newRenderVdom = this.render()
    compareTowVdom(oldDOM.parentNode, oldRenderVdom, newRenderVdom)


    this.oldRenderVdom = newRenderVdom
  }
}

export default Component