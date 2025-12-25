import type { V1Container } from '@kubernetes/client-node'

export interface ContainerPreset {
  name: string
  description: string
  config: Partial<V1Container>
}

export function useContainerPresets() {
  const presets: ContainerPreset[] = [
    {
      name: 'Nginx Web 服务器',
      description: '标准的 Nginx Web 服务器配置',
      config: {
        image: 'nginx:latest',
        ports: [
          {
            name: 'http',
            containerPort: 80,
            protocol: 'TCP'
          }
        ],
        resources: {
          requests: {
            cpu: '100m',
            memory: '128Mi'
          },
          limits: {
            cpu: '500m',
            memory: '512Mi'
          }
        },
        livenessProbe: {
          httpGet: {
            path: '/',
            port: 80
          },
          initialDelaySeconds: 10,
          periodSeconds: 10
        },
        readinessProbe: {
          httpGet: {
            path: '/',
            port: 80
          },
          initialDelaySeconds: 5,
          periodSeconds: 5
        }
      }
    },
    {
      name: 'MySQL 数据库',
      description: 'MySQL 数据库标准配置',
      config: {
        image: 'mysql:8.0',
        ports: [
          {
            name: 'mysql',
            containerPort: 3306,
            protocol: 'TCP'
          }
        ],
        env: [
          {
            name: 'MYSQL_ROOT_PASSWORD',
            value: 'changeme'
          }
        ],
        resources: {
          requests: {
            cpu: '500m',
            memory: '1Gi'
          },
          limits: {
            cpu: '2000m',
            memory: '4Gi'
          }
        },
        livenessProbe: {
          exec: {
            command: ['mysqladmin', 'ping', '-h', 'localhost']
          },
          initialDelaySeconds: 30,
          periodSeconds: 10
        }
      }
    },
    {
      name: 'Redis 缓存',
      description: 'Redis 缓存服务配置',
      config: {
        image: 'redis:7-alpine',
        ports: [
          {
            name: 'redis',
            containerPort: 6379,
            protocol: 'TCP'
          }
        ],
        resources: {
          requests: {
            cpu: '100m',
            memory: '256Mi'
          },
          limits: {
            cpu: '500m',
            memory: '1Gi'
          }
        },
        livenessProbe: {
          tcpSocket: {
            port: 6379
          },
          initialDelaySeconds: 15,
          periodSeconds: 10
        }
      }
    },
    {
      name: 'Node.js 应用',
      description: 'Node.js 应用标准配置',
      config: {
        image: 'node:18-alpine',
        ports: [
          {
            name: 'http',
            containerPort: 3000,
            protocol: 'TCP'
          }
        ],
        env: [
          {
            name: 'NODE_ENV',
            value: 'production'
          }
        ],
        resources: {
          requests: {
            cpu: '200m',
            memory: '256Mi'
          },
          limits: {
            cpu: '1000m',
            memory: '1Gi'
          }
        },
        livenessProbe: {
          httpGet: {
            path: '/health',
            port: 3000
          },
          initialDelaySeconds: 30,
          periodSeconds: 10
        },
        readinessProbe: {
          httpGet: {
            path: '/ready',
            port: 3000
          },
          initialDelaySeconds: 10,
          periodSeconds: 5
        }
      }
    },
    {
      name: 'Python Flask 应用',
      description: 'Python Flask Web 应用配置',
      config: {
        image: 'python:3.11-slim',
        ports: [
          {
            name: 'http',
            containerPort: 5000,
            protocol: 'TCP'
          }
        ],
        env: [
          {
            name: 'FLASK_ENV',
            value: 'production'
          }
        ],
        resources: {
          requests: {
            cpu: '200m',
            memory: '256Mi'
          },
          limits: {
            cpu: '1000m',
            memory: '1Gi'
          }
        }
      }
    },
    {
      name: '初始化容器',
      description: '用于初始化任务的容器模板',
      config: {
        image: 'busybox:latest',
        command: ['/bin/sh'],
        args: ['-c', 'echo "Initializing..." && sleep 5'],
        resources: {
          requests: {
            cpu: '50m',
            memory: '64Mi'
          },
          limits: {
            cpu: '100m',
            memory: '128Mi'
          }
        }
      }
    }
  ]

  return {
    presets,
    getPreset: (name: string) => presets.find(p => p.name === name),
    applyPreset: (container: Partial<V1Container>, presetName: string) => {
      const preset = presets.find(p => p.name === presetName)
      if (!preset) return container

      return {
        ...container,
        ...preset.config
      }
    }
  }
}