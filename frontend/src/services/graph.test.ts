import { describe, it, expect } from 'vitest'
import { GraphService, type GraphData, type GraphNode, type GraphLink } from './graph'

describe('GraphService', () => {
  describe('buildGraphData', () => {
    it('should build graph with nodes and links', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'Content A' },
        { id: '2', title: 'Note B', content: 'Content B' },
        { id: '3', title: 'Note C', content: 'Content C' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.nodes).toHaveLength(3)
      expect(graph.links).toHaveLength(0)
      expect(graph.nodes[0]).toEqual({
        id: '1',
        title: 'Note A',
        group: 1,
      })
    })

    it('should assign groups cyclically', () => {
      const notes = Array.from({ length: 7 }, (_, i) => ({
        id: `${i}`,
        title: `Note ${i}`,
        content: `Content ${i}`,
      }))

      const graph = GraphService.buildGraphData(notes)

      expect(graph.nodes[0].group).toBe(1)
      expect(graph.nodes[1].group).toBe(2)
      expect(graph.nodes[4].group).toBe(5)
      expect(graph.nodes[5].group).toBe(1) // Wraps around
      expect(graph.nodes[6].group).toBe(2)
    })

    it('should create links from bidirectional references', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'This references [[Note B]]' },
        { id: '2', title: 'Note B', content: 'Content B' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(1)
      expect(graph.links[0]).toEqual({
        source: '1',
        target: '2',
      })
    })

    it('should handle multiple references in one note', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'References [[Note B]] and [[Note C]]' },
        { id: '2', title: 'Note B', content: 'Content B' },
        { id: '3', title: 'Note C', content: 'Content C' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(2)
      expect(graph.links).toContainEqual({ source: '1', target: '2' })
      expect(graph.links).toContainEqual({ source: '1', target: '3' })
    })

    it('should handle case-insensitive references', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'References [[note b]]' },
        { id: '2', title: 'Note B', content: 'Content B' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(1)
      expect(graph.links[0]).toEqual({
        source: '1',
        target: '2',
      })
    })

    it('should not create self-referencing links', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'References [[Note A]] itself' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(0)
    })

    it('should not create duplicate links', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'References [[Note B]] and [[Note B]] again' },
        { id: '2', title: 'Note B', content: 'Content B' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(1)
    })

    it('should not create bidirectional duplicates', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'References [[Note B]]' },
        { id: '2', title: 'Note B', content: 'Also references [[Note A]]' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(1)
    })

    it('should skip references to non-existent notes', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'References [[Nonexistent Note]]' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(0)
    })

    it('should handle empty notes array', () => {
      const graph = GraphService.buildGraphData([])

      expect(graph.nodes).toHaveLength(0)
      expect(graph.links).toHaveLength(0)
    })

    it('should handle notes without references', () => {
      const notes = [
        { id: '1', title: 'Note A', content: 'No references here' },
        { id: '2', title: 'Note B', content: 'Also no references' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.nodes).toHaveLength(2)
      expect(graph.links).toHaveLength(0)
    })

    it('should handle complex reference patterns', () => {
      const notes = [
        { id: '1', title: 'Main Note', content: 'See [[Note A]] and [[Note B]] for details' },
        { id: '2', title: 'Note A', content: 'Related to [[Note B]]' },
        { id: '3', title: 'Note B', content: 'Standalone' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph.links).toHaveLength(3)
    })
  })

  describe('getNodeColor', () => {
    it('should return color for group 1', () => {
      expect(GraphService.getNodeColor(1)).toBe('#3B82F6')
    })

    it('should return color for group 2', () => {
      expect(GraphService.getNodeColor(2)).toBe('#10B981')
    })

    it('should return color for group 3', () => {
      expect(GraphService.getNodeColor(3)).toBe('#F59E0B')
    })

    it('should return color for group 4', () => {
      expect(GraphService.getNodeColor(4)).toBe('#EF4444')
    })

    it('should return color for group 5', () => {
      expect(GraphService.getNodeColor(5)).toBe('#8B5CF6')
    })

    it('should wrap around for group 6', () => {
      expect(GraphService.getNodeColor(6)).toBe('#3B82F6')
    })

    it('should wrap around for group 6', () => {
      expect(GraphService.getNodeColor(6)).toBe('#3B82F6')
    })

    it('should wrap around for group 7', () => {
      expect(GraphService.getNodeColor(7)).toBe('#10B981')
    })
  })

  describe('GraphData structure', () => {
    it('should return valid GraphData structure', () => {
      const notes = [
        { id: '1', title: 'Test', content: 'Content' },
      ]

      const graph = GraphService.buildGraphData(notes)

      expect(graph).toHaveProperty('nodes')
      expect(graph).toHaveProperty('links')
      expect(Array.isArray(graph.nodes)).toBe(true)
      expect(Array.isArray(graph.links)).toBe(true)
    })

    it('should have valid node structure', () => {
      const notes = [
        { id: '1', title: 'Test', content: 'Content' },
      ]

      const graph = GraphService.buildGraphData(notes)
      const node = graph.nodes[0]

      expect(node).toHaveProperty('id')
      expect(node).toHaveProperty('title')
      expect(node).toHaveProperty('group')
      expect(typeof node.id).toBe('string')
      expect(typeof node.title).toBe('string')
      expect(typeof node.group).toBe('number')
    })

    it('should have valid link structure', () => {
      const notes = [
        { id: '1', title: 'Note A', content: '[[Note B]]' },
        { id: '2', title: 'Note B', content: 'Content' },
      ]

      const graph = GraphService.buildGraphData(notes)
      const link = graph.links[0]

      expect(link).toHaveProperty('source')
      expect(link).toHaveProperty('target')
      expect(typeof link.source).toBe('string')
      expect(typeof link.target).toBe('string')
    })
  })
})
