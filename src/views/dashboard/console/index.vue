<!-- Kube Nova 项目架构展示页面 - 紧凑优化版 -->
<template>
  <div class="architecture-dashboard">
    <!-- 紧凑型渐变紫色头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <div class="logo-section">
          <div class="logo-icon">
            <ArtSvgIcon icon="ri:stack-line" />
          </div>
          <div class="title-section">
            <h1 class="title">Kube Nova</h1>
            <p class="subtitle">云原生 K8s 多集群管理平台</p>
          </div>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- 架构图模块 -->
    <ArchitectureDiagram />

    <!-- 功能进度和更新日志 -->
<!--    <ElRow :gutter="20" class="bottom-section">-->
<!--      <ElCol :sm="24" :lg="12">-->
<!--        <FeatureProgress />-->
<!--      </ElCol>-->
<!--      <ElCol :sm="24" :lg="12">-->
<!--        <UpdateLog />-->
<!--      </ElCol>-->
<!--    </ElRow>-->
  </div>
</template>

<script setup lang="ts">
  import ArchitectureDiagram from './modules/architecture-diagram.vue'
  import FeatureProgress from './modules/feature-progress.vue'
  import UpdateLog from './modules/update-log.vue'

  defineOptions({ name: 'ArchitectureDashboard' })

  // 统计数据（精简版）
  const stats = reactive([
    { label: '服务模块', value: '8+' },
    { label: '管理器', value: '7' },
    { label: '微服务', value: '3' },
    { label: '完成度', value: '85%' }
  ])
</script>

<style lang="scss" scoped>
  .architecture-dashboard {
    min-height: 100vh;
    padding: 0;

    .dashboard-header {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 16px 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
      overflow: hidden;

      // 简化的背景装饰
      &::before {
        content: '';
        position: absolute;
        top: -100px;
        right: -50px;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
        border-radius: 50%;
      }

      .header-left {
        flex-shrink: 0;
        position: relative;
        z-index: 1;

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;

          .logo-icon {
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
            transition: transform 0.2s ease;

            &:hover {
              transform: scale(1.05);
            }
          }

          .title-section {
            .title {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 2px 0;
              color: white;
              letter-spacing: 0.3px;
              line-height: 1.2;
            }

            .subtitle {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
              margin: 0;
              font-weight: 400;
            }
          }
        }
      }

      .header-stats {
        display: flex;
        gap: 8px;
        position: relative;
        z-index: 1;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          transition: all 0.2s ease;
          min-width: 70px;

          &:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
          }

          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: white;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 400;
            margin-top: 2px;
          }
        }
      }
    }

    .bottom-section {
      margin-top: 20px;
    }
  }

  // 响应式适配
  @media (max-width: 992px) {
    .architecture-dashboard {
      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
        padding: 16px 20px;

        .header-stats {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;

          .stat-item {
            width: 100%;
            padding: 8px 12px;
          }
        }
      }
    }
  }

  @media (max-width: 576px) {
    .architecture-dashboard {
      .dashboard-header {
        padding: 14px 16px;
        border-radius: 10px;

        .header-left {
          .logo-section {
            gap: 10px;

            .logo-icon {
              width: 36px;
              height: 36px;
              font-size: 18px;
            }

            .title-section {
              .title {
                font-size: 16px;
              }

              .subtitle {
                font-size: 11px;
              }
            }
          }
        }

        .header-stats {
          grid-template-columns: repeat(2, 1fr);

          .stat-item {
            padding: 8px 10px;

            .stat-value {
              font-size: 18px;
            }

            .stat-label {
              font-size: 10px;
            }
          }
        }
      }
    }
  }
</style>
