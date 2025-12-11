"use client";

export default function DesignSystemTest() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF8F3" }}>
      {/* 点阵网格背景 */}
      <div className="fixed inset-0 bg-grid-dots pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 space-y-16">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <h1
            className="text-6xl font-bold text-3d"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#F49D6E",
            }}
          >
            RETRO BRUTALISM
          </h1>
          <p
            className="text-xl"
            style={{
              fontFamily: "Inter, sans-serif",
              color: "#18181b",
            }}
          >
            Phase 1: 设计系统基础验证
          </p>
        </div>

        {/* 配色系统展示 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            配色系统
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Orange", color: "#F49D6E" },
              { name: "Yellow", color: "#FFD275" },
              { name: "Blue", color: "#AECBEB" },
              { name: "Black", color: "#18181b" },
              { name: "Red", color: "#FF6B6B" },
              { name: "Green", color: "#51CF66" },
              { name: "Purple", color: "#CC5DE8" },
              { name: "Cream", color: "#FDF8F3" },
            ].map((item) => (
              <div
                key={item.name}
                className="card-retro p-6 text-center"
                style={{
                  backgroundColor: item.color,
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                <div
                  className="font-bold text-lg"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: item.name === "Black" ? "#FDF8F3" : "#18181b",
                  }}
                >
                  {item.name}
                </div>
                <div
                  className="text-sm mt-2"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: item.name === "Black" ? "#FDF8F3" : "#18181b",
                  }}
                >
                  {item.color}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3D 文字效果 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            3D 文字效果
          </h2>
          <div className="space-y-6">
            <div
              className="text-6xl font-bold text-3d"
              style={{
                fontFamily: "Anton, sans-serif",
                color: "#F49D6E",
              }}
            >
              LARGE 3D TEXT
            </div>
            <div
              className="text-4xl font-bold text-3d-sm"
              style={{
                fontFamily: "Anton, sans-serif",
                color: "#FFD275",
              }}
            >
              Small 3D Text
            </div>
            <div
              className="text-5xl font-bold text-stroke"
              style={{
                fontFamily: "Anton, sans-serif",
              }}
            >
              STROKE OUTLINE
            </div>
          </div>
        </section>

        {/* 按钮样式 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            按钮样式
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              className="btn-retro px-6 py-3 font-bold"
              style={{
                backgroundColor: "#F49D6E",
                color: "#18181b",
                fontFamily: "Inter, sans-serif",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              Orange Button
            </button>
            <button
              className="btn-retro px-6 py-3 font-bold"
              style={{
                backgroundColor: "#FFD275",
                color: "#18181b",
                fontFamily: "Inter, sans-serif",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              Yellow Button
            </button>
            <button
              className="btn-retro px-6 py-3 font-bold"
              style={{
                backgroundColor: "#AECBEB",
                color: "#18181b",
                fontFamily: "Inter, sans-serif",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              Blue Button
            </button>
            <button
              className="btn-retro px-6 py-3 font-bold"
              style={{
                backgroundColor: "#51CF66",
                color: "#18181b",
                fontFamily: "Inter, sans-serif",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              Green Button
            </button>
            <button
              className="btn-retro px-6 py-3 font-bold"
              disabled
              style={{
                backgroundColor: "#e5e5e5",
                color: "#9ca3af",
                fontFamily: "Inter, sans-serif",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                cursor: "not-allowed",
              }}
            >
              Disabled Button
            </button>
          </div>
        </section>

        {/* 卡片样式 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            卡片样式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Orange Card", bg: "#F49D6E" },
              { name: "Yellow Card", bg: "#FFD275" },
              { name: "Blue Card", bg: "#AECBEB" },
            ].map((card) => (
              <div
                key={card.name}
                className="card-retro p-6 space-y-4"
                style={{
                  backgroundColor: card.bg,
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                <h3
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: "Anton, sans-serif",
                    color: "#18181b",
                  }}
                >
                  {card.name}
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    color: "#18181b",
                  }}
                >
                  这是一个 Retro Brutalism 风格的卡片。悬停时会有阴影和位移效果。
                </p>
                <div
                  className="text-4xl font-bold"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: "#18181b",
                  }}
                >
                  $99.99
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 输入框样式 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            输入框样式
          </h2>
          <div className="max-w-2xl space-y-4">
            <div>
              <label
                className="block mb-2 font-bold"
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: "#18181b",
                }}
              >
                普通输入框
              </label>
              <input
                type="text"
                placeholder="输入一些文字..."
                className="input-retro w-full px-4 py-3"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: "#FDF8F3",
                }}
              />
            </div>
            <div>
              <label
                className="block mb-2 font-bold"
                style={{
                  fontFamily: "Inter, sans-serif",
                  color: "#18181b",
                }}
              >
                文本域
              </label>
              <textarea
                placeholder="输入多行文字..."
                rows={4}
                className="input-retro w-full px-4 py-3 resize-none"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: "#FDF8F3",
                }}
              />
            </div>
          </div>
        </section>

        {/* 阴影系统 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            阴影系统
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="p-6"
              style={{
                backgroundColor: "#fff",
                border: "3px solid black",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              <div
                className="font-bold mb-2"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                shadow-retro
              </div>
              <div
                className="text-sm"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                4px 4px 0px 0px rgba(0,0,0,1)
              </div>
            </div>
            <div
              className="p-6"
              style={{
                backgroundColor: "#fff",
                border: "3px solid black",
                boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
              }}
            >
              <div
                className="font-bold mb-2"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                shadow-retro-lg
              </div>
              <div
                className="text-sm"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                8px 8px 0px 0px rgba(0,0,0,1)
              </div>
            </div>
            <div
              className="p-6"
              style={{
                backgroundColor: "#fff",
                border: "3px solid black",
                boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
              }}
            >
              <div
                className="font-bold mb-2"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                shadow-retro-hover
              </div>
              <div
                className="text-sm"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                2px 2px 0px 0px rgba(0,0,0,1)
              </div>
            </div>
          </div>
        </section>

        {/* 动画效果 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            动画效果
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="card-retro p-6 text-center"
              style={{
                backgroundColor: "#F49D6E",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                animation: "float 6s ease-in-out infinite",
              }}
            >
              <div
                className="font-bold text-xl"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                Float Slow
              </div>
              <div
                className="text-sm mt-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                6s 缓动浮动
              </div>
            </div>
            <div
              className="card-retro p-6 text-center"
              style={{
                backgroundColor: "#FFD275",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                animation: "float 4s ease-in-out infinite",
              }}
            >
              <div
                className="font-bold text-xl"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                Float Fast
              </div>
              <div
                className="text-sm mt-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                4s 快速浮动
              </div>
            </div>
            <div
              className="card-retro p-6 text-center"
              style={{
                backgroundColor: "#AECBEB",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                animation: "fadeIn 2s ease-out infinite",
              }}
            >
              <div
                className="font-bold text-xl"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                Fade In
              </div>
              <div
                className="text-sm mt-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                2s 淡入效果
              </div>
            </div>
          </div>
        </section>

        {/* 字体展示 */}
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold text-3d-sm"
            style={{
              fontFamily: "Anton, sans-serif",
              color: "#18181b",
            }}
          >
            字体系统
          </h2>
          <div className="space-y-4">
            <div>
              <div
                className="text-sm mb-2"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#666",
                }}
              >
                Anton (Display Font)
              </div>
              <div
                className="text-5xl font-bold"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                THE QUICK BROWN FOX
              </div>
            </div>
            <div>
              <div
                className="text-sm mb-2"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#666",
                }}
              >
                JetBrains Mono (Data Font)
              </div>
              <div
                className="text-3xl font-bold"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                $123,456.78 | 98.76% | 2025-12-11
              </div>
            </div>
            <div>
              <div
                className="text-sm mb-2"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#666",
                }}
              >
                Inter (Body Font)
              </div>
              <div className="text-xl" style={{ fontFamily: "Inter, sans-serif" }}>
                这是正文字体。Inter 是一个专为屏幕显示优化的字体，具有出色的可读性。The quick
                brown fox jumps over the lazy dog.
              </div>
            </div>
          </div>
        </section>

        {/* 完成标记 */}
        <section className="text-center py-12">
          <div
            className="inline-block card-retro px-12 py-6"
            style={{
              backgroundColor: "#51CF66",
              boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
            }}
          >
            <div
              className="text-4xl font-bold text-3d"
              style={{
                fontFamily: "Anton, sans-serif",
                color: "#18181b",
              }}
            >
              ✓ PHASE 1 COMPLETE
            </div>
            <div
              className="text-xl mt-4"
              style={{
                fontFamily: "Inter, sans-serif",
                color: "#18181b",
              }}
            >
              所有 Retro Brutalism 设计系统基础已就绪
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
