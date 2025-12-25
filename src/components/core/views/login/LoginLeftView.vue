<!-- 登录、注册、忘记密码左侧背景 -->
<template>
  <div class="login-left-view" :class="{ 'hide-content': hideContent }">
    <div class="logo">
      <ArtLogo class="icon" size="46" />
      <h1 class="title">{{ AppConfig.systemInfo.name }}</h1>
    </div>

    <div class="left-img" v-if="!hideContent">
      <ThemeSvg :src="kubeNovaIcon" size="100%" />
    </div>

    <div class="text-wrap" v-if="!hideContent">
      <h1>{{ $t('login.leftView.title') }}</h1>
      <p>{{ $t('login.leftView.subTitle') }}</p>
    </div>

    <!-- 几何装饰元素 -->
    <div class="geometric-decorations" v-if="!hideContent">
      <!-- 基础几何形状 -->
      <div class="geo-element circle-outline animate-fade-in-up" style="animation-delay: 0.1s"></div>
      <div class="geo-element square-rotated animate-fade-in-left" style="animation-delay: 0.2s"></div>
      <div class="geo-element circle-small animate-fade-in-up" style="animation-delay: 0.3s"></div>

      <!-- 太阳/月亮切换 -->
      <div
        class="geo-element circle-top-right animate-fade-in-down"
        style="animation-delay: 0.2s"
        @click="themeAnimation"
      ></div>

      <!-- 装饰点 -->
      <div class="geo-element dot dot-1 animate-bounce-in" style="animation-delay: 0.4s"></div>
      <div class="geo-element dot dot-2 animate-bounce-in" style="animation-delay: 0.5s"></div>
      <div class="geo-element dot dot-3 animate-bounce-in" style="animation-delay: 0.6s"></div>

      <!-- 背景泡泡 -->
      <div class="geo-element bg-bubble animate-scale-in" style="animation-delay: 0.3s"></div>

      <!-- 叠加方块组 -->
      <div class="squares-group">
        <i class="geo-element square square-blue animate-fade-in-left" style="animation-delay: 0.3s"></i>
        <i class="geo-element square square-cyan animate-fade-in-left" style="animation-delay: 0.5s"></i>
        <i class="geo-element square square-purple animate-fade-in-left" style="animation-delay: 0.7s"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import kubeNovaIcon from '@imgs/svg/kube_nova.svg'
  import { themeAnimation } from '@/utils/ui/animation'

  defineProps<{
    hideContent?: boolean
  }>()
</script>

<style lang="scss" scoped>
  $primary-light-7: var(--el-color-primary-light-7);
  $primary-light-8: var(--el-color-primary-light-8);
  $primary-light-9: var(--el-color-primary-light-9);
  $primary-base: var(--el-color-primary);
  $main-bg: var(--default-box-color);

  $bg-mix-light-9: color-mix(in srgb, $primary-light-9 100%, $main-bg);
  $bg-mix-light-8: color-mix(in srgb, $primary-light-8 80%, $main-bg);
  $bg-mix-light-7: color-mix(in srgb, $primary-light-7 80%, $main-bg);

  .login-left-view {
    position: relative;
    box-sizing: border-box;
    width: 65vw;
    height: 100%;
    padding: 15px;
    overflow: hidden;
    background-color: $bg-mix-light-9;

    .logo {
      position: relative;
      z-index: 100;
      display: flex;
      align-items: center;

      .title {
        margin-left: 10px;
        font-size: 20px;
        font-weight: 400;
      }
    }

    .left-img {
      position: absolute;
      inset: 0 0 8%;
      z-index: 10;
      width: 70%;
      max-width: 800px;
      margin: auto;
      animation: slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;

      :deep(svg) {
        width: 100%;
        height: 100%;
        shape-rendering: geometricPrecision;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        filter: drop-shadow(0 12px 32px rgba(50, 108, 229, 0.18));
      }
    }

    .text-wrap {
      position: absolute;
      bottom: 60px;
      width: 100%;
      text-align: center;
      animation: slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;

      h1 {
        font-size: 26px;
        font-weight: 500;
        color: var(--art-gray-900) !important;
      }

      p {
        margin-top: 12px;
        font-size: 15px;
        color: var(--art-gray-600) !important;
      }
    }

    .geometric-decorations {
      .geo-element {
        position: absolute;
        opacity: 0;
        animation-fill-mode: forwards;
        animation-duration: 0.8s;
        animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes bounceIn {
        0% {
          opacity: 0;
          transform: scale(0.3);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
        70% {
          transform: scale(0.9);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .animate-fade-in-up { animation-name: fadeInUp; }
      .animate-fade-in-down { animation-name: fadeInDown; }
      .animate-fade-in-left { animation-name: fadeInLeft; }
      .animate-scale-in { animation-name: scaleIn; animation-duration: 1.2s; }
      .animate-bounce-in { animation-name: bounceIn; animation-duration: 0.6s; }

      // 基础几何形状
      .circle-outline {
        top: 10%;
        left: 25%;
        width: 42px;
        height: 42px;
        border: 2px solid $primary-light-8;
        border-radius: 50%;
      }

      .square-rotated {
        top: 50%;
        left: 16%;
        width: 60px;
        height: 60px;
        background-color: $bg-mix-light-8;
        transform: rotate(-25deg);
      }

      .circle-small {
        bottom: 26%;
        left: 30%;
        width: 18px;
        height: 18px;
        background-color: $primary-light-8;
        border-radius: 50%;
      }

      // 太阳/月亮
      .circle-top-right {
        top: 3%;
        right: 3%;
        z-index: 100;
        width: 50px;
        height: 50px;
        cursor: pointer;
        background: $bg-mix-light-7;
        border-radius: 50%;
        transition: all 0.3s;

        &::after {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          content: '';
          background: linear-gradient(to right, #fcbb04, #fffc00);
          border-radius: 50%;
          opacity: 0;
          transition: all 0.5s;
          transform: translate(-50%, -50%);
        }

        &:hover {
          box-shadow: 0 0 36px #fffc00;
          &::after { opacity: 1; }
        }
      }

      // 背景泡泡
      .bg-bubble {
        top: -120px;
        right: -120px;
        width: 360px;
        height: 360px;
        background-color: $bg-mix-light-8;
        border-radius: 50%;
      }

      // 装饰点
      .dot {
        width: 14px;
        height: 14px;
        background-color: $primary-light-7;
        border-radius: 50%;

        &.dot-1 {
          top: 140px;
          left: 100px;
        }
        &.dot-2 {
          top: 140px;
          right: 120px;
        }
        &.dot-3 {
          top: 46%;
          right: 22%;
          background-color: $primary-light-8;
        }
      }

      // 叠加方块组
      .squares-group {
        position: absolute;
        bottom: 18px;
        left: 20px;
        width: 140px;
        height: 140px;
        pointer-events: none;

        .square {
          position: absolute;
          display: block;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgb(64 87 167 / 12%);

          &.square-blue {
            top: 12px;
            left: 30px;
            z-index: 2;
            width: 50px;
            height: 50px;
            background-color: rgb(from $primary-base r g b / 30%);
            transform: rotate(-10deg);
          }

          &.square-cyan {
            top: 30px;
            left: 48px;
            z-index: 1;
            width: 70px;
            height: 70px;
            background-color: rgb(from $primary-base r g b / 15%);
            transform: rotate(10deg);
          }

          &.square-purple {
            top: 66px;
            left: 86px;
            z-index: 3;
            width: 32px;
            height: 32px;
            background-color: rgb(from $primary-base r g b / 45%);
          }
        }

        &::after {
          position: absolute;
          top: 86px;
          left: 72px;
          width: 80px;
          height: 1px;
          content: '';
          background: linear-gradient(90deg, var(--el-color-primary-light-6), transparent);
          opacity: 0;
          transform: rotate(50deg);
          animation: fadeInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-delay: 1.2s;
        }
      }
    }

    // 响应式适配
    @media only screen and (max-width: 1600px) {
      width: 60vw;

      .left-img {
        width: 65%;
        max-width: 700px;
      }

      .text-wrap {
        bottom: 50px;
        h1 { font-size: 24px; }
        p { font-size: 14px; }
      }
    }

    @media only screen and (min-width: 1800px) {
      .left-img {
        width: 68%;
        max-width: 850px;
      }
    }

    @media only screen and (min-width: 2000px) {
      .left-img {
        width: 65%;
        max-width: 900px;
      }
    }

    @media only screen and (max-width: 1400px) {
      .left-img {
        width: 62%;
        max-width: 650px;
      }
    }

    @media only screen and (max-width: 1180px) {
      width: auto;
      height: auto;
      padding: 0;
      background: transparent;

      .left-img,
      .text-wrap,
      .geometric-decorations {
        display: none;
      }

      .logo {
        display: none;
      }
    }

    &.hide-content {
      .left-img,
      .text-wrap,
      .geometric-decorations {
        display: none;
      }
    }
  }

  // 暗色主题
  .dark .login-left-view {
    background-color: color-mix(in srgb, $primary-light-9 60%, #070707);

    @media only screen and (max-width: 1180px) {
      background: transparent;
    }

    .geometric-decorations {
      .circle-top-right {
        background-color: $bg-mix-light-8;
        box-shadow: 0 0 25px #333 inset;
        transition: all 0.3s ease-in-out 0.1s;
        rotate: -48deg;

        &::before {
          position: absolute;
          top: 0;
          left: 15px;
          width: 50px;
          height: 50px;
          content: '';
          background-color: $bg-mix-light-9;
          border-radius: 50%;
          transition: all 0.3s ease-in-out;
        }

        &:hover {
          background-color: transparent;
          box-shadow: 0 40px 25px #ddd inset;
          &::before { left: 18px; }
          &::after { opacity: 0; }
        }
      }

      .bg-bubble {
        background-color: $bg-mix-light-9;
      }

      .square-rotated {
        background-color: $bg-mix-light-9;
      }

      .circle-small,
      .dot {
        background-color: $primary-light-8;
      }
    }

    .squares-group {
      .square {
        box-shadow: none;

        &.square-blue {
          background-color: rgb(from $primary-base r g b / 18%);
        }
        &.square-cyan {
          background-color: rgb(from $primary-base r g b / 10%);
        }
        &.square-purple {
          background-color: rgb(from $primary-base r g b / 20%);
        }
      }

      &::after {
        background: linear-gradient(90deg, $primary-light-8, transparent);
      }
    }
  }
</style>