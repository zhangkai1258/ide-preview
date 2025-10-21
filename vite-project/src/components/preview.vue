<template>
  <div class="preview-container">
    <!-- 导航栏区域 -->
    <div class="navigation-bar">
      <!-- 左侧三组开关区域 -->
      <div class="left-controls">
        <!-- 第一组：页面预览/代码切换 -->
        <div class="control-group">
          <el-button-group>
            <el-button 
              :type="activeTab === 'preview' ? 'primary' : ''"
              @click="switchTab('preview')"
              :icon="View"
            >
              页面预览
            </el-button>
            <el-button 
              :type="activeTab === 'code' ? 'primary' : ''"
              @click="switchTab('code')"
              :icon="Document"
            >
              代码
            </el-button>
          </el-button-group>
        </div>

        <!-- 第二组：设备尺寸选择 -->
        <div class="control-group">
          <el-button-group>
            <el-button 
              :type="deviceSize === 'mobile' ? 'primary' : ''"
              @click="switchDevice('mobile')"
              :icon="Iphone"
              :disabled="activeTab === 'code'"
              :title="activeTab === 'code' ? '设备尺寸切换仅对页面预览有效' : '切换到手机尺寸'"
            >
              手机
            </el-button>
            <el-button 
              :type="deviceSize === 'desktop' ? 'primary' : ''"
              @click="switchDevice('desktop')"
              :icon="Monitor"
              :disabled="activeTab === 'code'"
              :title="activeTab === 'code' ? '设备尺寸切换仅对页面预览有效' : '切换到电脑尺寸'"
            >
              电脑
            </el-button>
          </el-button-group>
        </div>

        <!-- 第三组：刷新按钮 -->
        <div class="control-group">
          <el-button 
            @click="refreshView"
            :icon="Refresh"
            circle
          />
        </div>
      </div>

      <!-- 中间部分（预留样式） -->
      <div class="center-area">
        <span class="page-title">Homepage</span>
      </div>

      <!-- 右侧按钮区域 -->
      <div class="right-controls">
        <el-button :icon="Edit" circle />
        <el-button :icon="Link" circle />
        <el-button type="primary">发布</el-button>
      </div>
    </div>

    <!-- 视图区域 -->
    <div class="view-area" :class="getViewAreaClass()">
      <div class="view-container">
        <!-- 页面预览模式 -->
        <div v-if="activeTab === 'preview'" class="preview-mode">
          <div v-if="previewUrl" class="iframe-container">
            <!-- 缩放控制工具栏 -->
            <div class="iframe-toolbar">
              <div class="zoom-controls">
                <el-button size="small" @click="zoomOut" :icon="ZoomOut">缩小</el-button>
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                <el-button size="small" @click="zoomIn" :icon="ZoomIn">放大</el-button>
                <el-button size="small" @click="resetZoom">重置</el-button>
              </div>
              <div class="view-controls">
                <el-button size="small" @click="toggleFullscreen" :icon="FullScreen">
                  {{ isFullscreen ? '退出全屏' : '全屏' }}
                </el-button>
                <el-button size="small" @click="refreshPreview" :icon="Refresh">刷新</el-button>
              </div>
            </div>
            
            <!-- iframe容器 -->
            <div class="iframe-wrapper" :style="iframeStyle">
              <iframe 
                :src="previewUrl"
                class="preview-iframe"
                frameborder="0"
                @error="handleIframeError"
                @load="handleIframeLoad"
                :style="iframeScaleStyle"
              />
            </div>
          </div>
          <div v-if="previewError" class="error-state">
            <el-result
              icon="warning"
              title="页面加载失败"
              :sub-title="previewError"
            >
              <template #extra>
                <el-button type="primary" @click="retryLoad">重试</el-button>
              </template>
            </el-result>
          </div>
          <div v-else-if="!previewUrl" class="empty-state">
            <el-empty description="暂无预览内容" />
          </div>
        </div>

        <!-- 代码模式 -->
        <div v-if="activeTab === 'code'" class="code-mode">
          <iframe 
            v-if="codeUrl"
            :src="codeUrl"
            class="code-iframe"
            frameborder="0"
            @error="handleIframeError"
            @load="handleIframeLoad"
          />
          <div v-if="codeError" class="error-state">
            <el-result
              icon="warning"
              title="代码编辑器加载失败"
              :sub-title="codeError"
            >
              <template #extra>
                <el-button type="primary" @click="retryLoad">重试</el-button>
              </template>
            </el-result>
          </div>
          <div v-else-if="!codeUrl" class="empty-state">
            <el-empty description="暂无代码编辑器" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { 
  View, 
  Document, 
  Iphone, 
  Monitor, 
  Refresh, 
  Edit, 
  Link,
  ZoomIn,
  ZoomOut,
  FullScreen
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('preview')
const deviceSize = ref('desktop')
const previewUrl = ref('')
const codeUrl = ref('')
const previewError = ref('')
const codeError = ref('')

// iframe缩放相关
const zoomLevel = ref(1)
const isFullscreen = ref(false)
const iframeWidth = ref(375) // 默认手机宽度
const iframeHeight = ref(667) // 默认手机高度

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab
  // 清除之前的错误状态
  previewError.value = ''
  codeError.value = ''
  
  if (tab === 'preview') {
    // 使用本地测试页面，避免X-Frame-Options问题
    // previewUrl.value = '/test-preview.html'
    previewUrl.value = 'https://h5-606.created.app/'
  } else if (tab === 'code') {
    // 使用CodePen作为代码编辑器示例
    // codeUrl.value = 'http://gitlib.aiyouthlab.com/-/ide/project/zhangkai/test-vscode/edit/master/-/'
    // codeUrl.value = 'https://h5-606.created.app/'
  }
}

// 切换设备尺寸
const switchDevice = (device) => {
  deviceSize.value = device
  
  // 根据设备类型设置iframe尺寸
  if (device === 'mobile') {
    iframeWidth.value = 375
    iframeHeight.value = 667
  } else {
    iframeWidth.value = 1200
    iframeHeight.value = 800
  }
  
  // 切换设备时重置缩放
  zoomLevel.value = 1
}

// 获取视图区域的CSS类名
const getViewAreaClass = () => {
  // 如果是代码模式，始终使用桌面尺寸
  if (activeTab.value === 'code') {
    return 'desktop'
  }
  // 如果是预览模式，使用用户选择的设备尺寸
  return deviceSize.value
}

// 计算iframe样式
const iframeStyle = computed(() => {
//   if (isFullscreen.value) {
//     return {
//       width: '100vw',
//       height: '100vh',
//       position: 'fixed',
//       top: '0',
//       left: '0',
//       zIndex: '9999',
//       background: '#fff'
//     }
//   }
  
  if (deviceSize.value === 'mobile') {
    return {
      width: `${iframeWidth.value}px`,
      height: `${iframeHeight.value}px`,
      margin: '0 auto'
    }
  }
  
  return {
    width: '100%',
    height: '100%'
  }
})

// 计算iframe缩放样式
const iframeScaleStyle = computed(() => {
  if (isFullscreen.value) {
    return {
      transform: 'none',
      width: '100%',
      height: '100%'
    }
  }
  
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: 'top left',
    width: `${100 / zoomLevel.value}%`,
    height: `${100 / zoomLevel.value}%`
  }
})

// 缩放控制函数
const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.1
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.3) {
    zoomLevel.value -= 0.1
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    // zoomLevel.value = 1 // 全屏时重置缩放
  }
}

// 刷新预览
const refreshPreview = () => {
  const iframe = document.querySelector('.preview-iframe')
  if (iframe) {
    iframe.src = iframe.src
  }
}

// 处理iframe错误
const handleIframeError = () => {
  if (activeTab.value === 'preview') {
    previewError.value = '页面无法加载，可能是由于X-Frame-Options限制或网络问题'
  } else if (activeTab.value === 'code') {
    codeError.value = '代码编辑器无法加载，可能是由于X-Frame-Options限制或网络问题'
  }
}

// 处理iframe加载成功
const handleIframeLoad = () => {
  if (activeTab.value === 'preview') {
    previewError.value = ''
  } else if (activeTab.value === 'code') {
    codeError.value = ''
  }
}

// 重试加载
const retryLoad = () => {
  if (activeTab.value === 'preview') {
    previewError.value = ''
    const iframe = document.querySelector('.preview-iframe')
    if (iframe) {
      iframe.src = iframe.src
    }
  } else if (activeTab.value === 'code') {
    codeError.value = ''
    const iframe = document.querySelector('.code-iframe')
    if (iframe) {
      iframe.src = iframe.src
    }
  }
}

// 刷新视图
const refreshView = () => {
  if (activeTab.value === 'preview' && previewUrl.value) {
    // 刷新iframe
    const iframe = document.querySelector('.preview-iframe')
    if (iframe) {
      iframe.src = iframe.src
    }
  } else if (activeTab.value === 'code' && codeUrl.value) {
    // 刷新代码编辑器
    const iframe = document.querySelector('.code-iframe')
    if (iframe) {
      iframe.src = iframe.src
    }
  }
}
</script>

<style scoped>
.preview-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* 导航栏样式 */
.navigation-bar {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
}

.center-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 视图区域样式 */
.view-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.view-container {
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 设备尺寸样式 */
.view-area.mobile .view-container {
  max-width: 375px;
  max-height: 667px;
}

.view-area.desktop .view-container {
  max-width: 100%;
  max-height: 100%;
}

/* 代码模式特殊样式 - 始终全屏显示 */
.code-mode {
  width: 100%;
  height: 100%;
}

.code-mode .code-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* 预览模式样式 */
.preview-mode,
.code-mode {
  width: 100%;
  height: 100%;
  position: relative;
}

/* iframe容器样式 */
.iframe-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.iframe-toolbar {
  background: #f5f5f5;
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-level {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.iframe-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
}

.iframe-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.iframe-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.iframe-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.iframe-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.preview-iframe,
.code-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.empty-state,
.error-state {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 禁用状态的按钮样式 */
.control-group .el-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* .control-group .el-button:disabled:hover {
  background-color: inherit;
  border-color: inherit;
} */

/* 响应式设计 */
@media (max-width: 768px) {
  .navigation-bar {
    padding: 0 10px;
  }
  
  .left-controls {
    gap: 8px;
  }
  
  .control-group .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .right-controls {
    gap: 8px;
  }
}
</style>
