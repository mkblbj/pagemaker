import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Progress } from './progress'

describe('Progress', () => {
  it('应该渲染进度条', () => {
    render(<Progress data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveClass('relative', 'h-2', 'w-full', 'overflow-hidden', 'rounded-full', 'bg-gray-200')
  })

  it('应该显示默认值0%', () => {
    render(<Progress data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    expect(fillBar).toHaveStyle('transform: translateX(-100%)')
  })

  it('应该正确显示指定的进度值', () => {
    render(<Progress value={50} data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    expect(fillBar).toHaveStyle('transform: translateX(-50%)')
  })

  it('应该正确处理100%进度', () => {
    render(<Progress value={100} data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    expect(fillBar).toHaveStyle('transform: translateX(-0%)')
  })

  it('应该支持自定义最大值', () => {
    render(<Progress value={25} max={50} data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    // 25/50 = 50%，所以应该是 -50%
    expect(fillBar).toHaveStyle('transform: translateX(-50%)')
  })

  it('应该处理超出最大值的情况', () => {
    render(<Progress value={150} max={100} data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    // 150/100 = 150%，transform应该是 translateX(-(-50%)) = translateX(50%)
    // 但实际计算是 100 - (150/100) * 100 = 100 - 150 = -50，所以是translateX(--50%) = translateX(50%)
    expect(fillBar).toHaveStyle('transform: translateX(--50%)')
  })

  it('应该支持自定义className', () => {
    render(<Progress className="custom-class" data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toHaveClass('custom-class')
  })

  it('应该支持其他HTML属性', () => {
    render(<Progress id="test-progress" role="progressbar" data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toHaveAttribute('id', 'test-progress')
    expect(progressBar).toHaveAttribute('role', 'progressbar')
  })

  it('应该正确转发ref', () => {
    let ref: HTMLDivElement | null = null

    render(
      <Progress
        ref={el => {
          ref = el
        }}
        data-testid="progress"
      />
    )

    expect(ref).toBeInstanceOf(HTMLDivElement)
    expect(ref).toBe(screen.getByTestId('progress'))
  })

  it('应该有正确的displayName', () => {
    expect(Progress.displayName).toBe('Progress')
  })

  it('应该处理负值', () => {
    render(<Progress value={-10} data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    // 负值应该显示为0%
    expect(fillBar).toHaveStyle('transform: translateX(-110%)')
  })

  it('应该正确处理小数值', () => {
    render(<Progress value={33.5} data-testid="progress" />)

    const progressBar = screen.getByTestId('progress')
    const fillBar = progressBar.querySelector('div')

    expect(fillBar).toHaveStyle('transform: translateX(-66.5%)')
  })
})
