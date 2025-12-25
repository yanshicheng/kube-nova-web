<template>
  <div class="loading-state">
    <div class="spinner"></div>
    <div class="loading-text">加载中...</div>
  </div>
</template>

<style lang="scss" scoped>
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #94a3b8;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(88, 166, 255, 0.1);
    border-top-color: #58a6ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  .loading-text {
    font-size: 16px;
    color: #94a3b8;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
