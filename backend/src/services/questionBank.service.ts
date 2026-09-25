import { QuestionBank, IQuestionBank } from '../models/QuestionBank.js';

export interface IQuestionSearchParams {
  q?: string;
  category?: string;
  domain?: string;
  difficulty?: string;
  format?: string;
  limit?: number;
  page?: number;
}

export class QuestionBankService {
  /**
   * Comprehensive Initial Curated Question Library
   */
  private static readonly CURATED_QUESTIONS: Array<Partial<IQuestionBank>> = [
    // ----------------------------------------------------
    // 1. DATA STRUCTURES & ALGORITHMS (POPULAR PROBLEMS)
    // ----------------------------------------------------
    {
      problemNumber: 1,
      title: 'Two Sum',
      questionText:
        'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
      domain: 'Fullstack',
      category: 'Arrays & Hashing',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 15,
      hints: [
        'A brute force approach checks every pair in O(N^2) time. Can you do it in O(N) using extra space?',
        'Use a Hash Map to store numbers you have visited along with their indices.',
        'For each number `x`, check if `target - x` exists in the hash map.',
      ],
      rubricCriteria: [
        { title: 'Time Complexity (O(N))', weight: 35, keyPointsToLookFor: ['Single pass hash map lookup', 'Avoid O(N^2) nested loops'] },
        { title: 'Space Complexity (O(N))', weight: 25, keyPointsToLookFor: ['Correct map key-value storage'] },
        { title: 'Edge Cases & Clean Code', weight: 40, keyPointsToLookFor: ['Empty or short arrays', 'Negative integers', 'Duplicate values'] },
      ],
      idealAnswerOutline:
        '1. Initialize a hash map `seen = new Map<number, number>()`.\n2. Iterate through `nums` with index `i`.\n3. Compute `complement = target - nums[i]`.\n4. If `seen.has(complement)`, return `[seen.get(complement), i]`.\n5. Otherwise, `seen.set(nums[i], i)`.\n6. Time: O(N), Space: O(N).',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function twoSum(nums: number[], target: number): number[] {\n  // Implement O(N) hash map solution\n  return [];\n}`,
        solutionCode: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) {\n      return [map.get(comp)!, i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
        testCases: [
          { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
          { input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' },
          { input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]' },
        ],
      },
      tags: ['arrays', 'hash-map', 'leetcode', '1', 'two-sum', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 142,
    },
    {
      problemNumber: 217,
      title: 'Contains Duplicate',
      questionText:
        'Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.',
      domain: 'Fullstack',
      category: 'Arrays & Hashing',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 10,
      hints: [
        'A Hash Set stores unique elements and provides O(1) lookup.',
        'Iterate through the array and check if the element is already in the set.',
      ],
      rubricCriteria: [
        { title: 'Algorithmic Efficiency', weight: 40, keyPointsToLookFor: ['Uses Set for O(N) time', 'Avoids quadratic time comparisons'] },
        { title: 'Space Optimization', weight: 30, keyPointsToLookFor: ['Set capacity matches unique elements'] },
        { title: 'Early Termination', weight: 30, keyPointsToLookFor: ['Returns true as soon as duplicate is seen'] },
      ],
      idealAnswerOutline:
        '1. Initialize a Set `seen = new Set<number>()`.\n2. Iterate through each element in `nums`.\n3. If `seen.has(num)`, return `true` immediately.\n4. Else `seen.add(num)`.\n5. If loop completes, return `false`.\n6. Alternatively: `return new Set(nums).size !== nums.length;`.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function containsDuplicate(nums: number[]): boolean {\n  // Return true if duplicate exists\n  return false;\n}`,
        solutionCode: `function containsDuplicate(nums: number[]): boolean {\n  const seen = new Set<number>();\n  for (const n of nums) {\n    if (seen.has(n)) return true;\n    seen.add(n);\n  }\n  return false;\n}`,
        testCases: [
          { input: '[1,2,3,1]', expectedOutput: 'true' },
          { input: '[1,2,3,4]', expectedOutput: 'false' },
          { input: '[1,1,1,3,3,4,3,2,4,2]', expectedOutput: 'true' },
        ],
      },
      tags: ['arrays', 'set', 'hash-table', 'leetcode', '217', 'contains-duplicate', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 198,
    },
    {
      problemNumber: 242,
      title: 'Valid Anagram',
      questionText:
        'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
      domain: 'Fullstack',
      category: 'Strings',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 10,
      hints: [
        'Check lengths first: if lengths differ, they cannot be anagrams.',
        'Count frequency of characters in `s` and decrement with `t`.',
      ],
      rubricCriteria: [
        { title: 'Frequency Counting', weight: 40, keyPointsToLookFor: ['Fixed size array or hash table', 'O(N) time'] },
        { title: 'Unicode & Boundary Handling', weight: 30, keyPointsToLookFor: ['Length mismatch check', 'Handles duplicate characters'] },
        { title: 'Space Complexity', weight: 30, keyPointsToLookFor: ['O(1) extra space for fixed 26 letters or O(k)'] },
      ],
      idealAnswerOutline:
        '1. If s.length !== t.length return false.\n2. Create frequency map or array of size 26.\n3. Increment for chars in s, decrement for chars in t.\n4. Verify all counts are zero.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function isAnagram(s: string, t: string): boolean {\n  // Check if t is an anagram of s\n  return false;\n}`,
        solutionCode: `function isAnagram(s: string, t: string): boolean {\n  if (s.length !== t.length) return false;\n  const counts = new Map<string, number>();\n  for (const c of s) counts.set(c, (counts.get(c) || 0) + 1);\n  for (const c of t) {\n    if (!counts.has(c) || counts.get(c)! <= 0) return false;\n    counts.set(c, counts.get(c)! - 1);\n  }\n  return true;\n}`,
        testCases: [
          { input: 's = "anagram", t = "nagaram"', expectedOutput: 'true' },
          { input: 's = "rat", t = "car"', expectedOutput: 'false' },
        ],
      },
      tags: ['strings', 'hash-map', 'anagram', 'leetcode', '242', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 165,
    },
    {
      problemNumber: 20,
      title: 'Valid Parentheses',
      questionText:
        'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.',
      domain: 'Fullstack',
      category: 'Stacks & Queues',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 12,
      hints: [
        'Use a Stack (LIFO) structure to track open brackets.',
        'When encountering a closing bracket, check if the stack top matches the corresponding open bracket.',
      ],
      rubricCriteria: [
        { title: 'Stack Implementation', weight: 40, keyPointsToLookFor: ['LIFO order', 'Push open brackets and pop on closing'] },
        { title: 'Edge Cases', weight: 30, keyPointsToLookFor: ['Empty string', 'Unbalanced open/closing tags', 'Odd length string'] },
        { title: 'Clean Map Matching', weight: 30, keyPointsToLookFor: ['Uses lookup dictionary for pairs'] },
      ],
      idealAnswerOutline:
        '1. Use a stack.\n2. Map closing to opening brackets: { ")": "(", "}": "{", "]": "[" }.\n3. Loop through chars: if open, push. If closed, pop and check match.\n4. Return stack.length === 0.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function isValid(s: string): boolean {\n  // Implement stack validation\n  return false;\n}`,
        solutionCode: `function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };\n  for (const char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else if (pairs[char]) {\n      if (stack.pop() !== pairs[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}`,
        testCases: [
          { input: 's = "()"', expectedOutput: 'true' },
          { input: 's = "()[]{}"', expectedOutput: 'true' },
          { input: 's = "(]"', expectedOutput: 'false' },
        ],
      },
      tags: ['stacks', 'strings', 'leetcode', '20', 'valid-parentheses', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 220,
    },
    {
      problemNumber: 704,
      title: 'Binary Search',
      questionText:
        'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`. You must write an algorithm with `O(log n)` runtime complexity.',
      domain: 'Fullstack',
      category: 'Binary Search',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 10,
      hints: [
        'Maintain `left` and `right` pointers.',
        'Calculate `mid = Math.floor((left + right) / 2)` or `left + Math.floor((right - left) / 2)` to avoid integer overflow.',
        'Adjust `left = mid + 1` or `right = mid - 1` based on comparison.',
      ],
      rubricCriteria: [
        { title: 'Logarithmic Complexity', weight: 40, keyPointsToLookFor: ['O(log N) divide-and-conquer runtime'] },
        { title: 'Pointer Updates', weight: 30, keyPointsToLookFor: ['Correct left/right boundaries', 'Avoid infinite loops'] },
        { title: 'Overflow Prevention', weight: 30, keyPointsToLookFor: ['Midpoint calculation formula'] },
      ],
      idealAnswerOutline:
        '1. Set left = 0, right = nums.length - 1.\n2. While left <= right: mid = Math.floor(left + (right - left) / 2).\n3. If nums[mid] === target return mid.\n4. If nums[mid] < target, left = mid + 1, else right = mid - 1.\n5. Return -1 if not found.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function search(nums: number[], target: number): number {\n  // Implement O(log n) binary search\n  return -1;\n}`,
        solutionCode: `function search(nums: number[], target: number): number {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor(left + (right - left) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
        testCases: [
          { input: 'nums = [-1,0,3,5,9,12], target = 9', expectedOutput: '4' },
          { input: 'nums = [-1,0,3,5,9,12], target = 2', expectedOutput: '-1' },
        ],
      },
      tags: ['binary-search', 'arrays', 'divide-and-conquer', 'leetcode', '704', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 180,
    },
    {
      problemNumber: 206,
      title: 'Reverse Linked List',
      questionText:
        'Given the `head` of a singly linked list, reverse the list, and return the reversed list head. Solve it both iteratively and recursively.',
      domain: 'Fullstack',
      category: 'Linked Lists',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 15,
      hints: [
        'Iterative: Maintain `prev`, `curr`, and `next` pointers.',
        'At each step, save `curr.next`, point `curr.next = prev`, then shift `prev` and `curr` forward.',
      ],
      rubricCriteria: [
        { title: 'Pointer Manipulation', weight: 40, keyPointsToLookFor: ['No lost nodes', 'Correct reversal of next pointers'] },
        { title: 'O(1) Space Iteration', weight: 30, keyPointsToLookFor: ['In-place reversal'] },
        { title: 'Null/Single Node Handling', weight: 30, keyPointsToLookFor: ['Handles empty list gracefully'] },
      ],
      idealAnswerOutline:
        '1. Set prev = null, curr = head.\n2. While curr !== null: next = curr.next; curr.next = prev; prev = curr; curr = next;\n3. Return prev.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `class ListNode {\n  val: number;\n  next: ListNode | null;\n  constructor(val?: number, next?: ListNode | null) {\n    this.val = val === undefined ? 0 : val;\n    this.next = next === undefined ? null : next;\n  }\n}\n\nfunction reverseList(head: ListNode | null): ListNode | null {\n  // Reverse and return head\n  return null;\n}`,
        solutionCode: `function reverseList(head: ListNode | null): ListNode | null {\n  let prev: ListNode | null = null;\n  let curr = head;\n  while (curr !== null) {\n    const nextTemp = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nextTemp;\n  }\n  return prev;\n}`,
        testCases: [
          { input: 'head = [1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
          { input: 'head = [1,2]', expectedOutput: '[2,1]' },
          { input: 'head = []', expectedOutput: '[]' },
        ],
      },
      tags: ['linked-lists', 'pointers', 'leetcode', '206', 'reverse-list', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 175,
    },
    {
      problemNumber: 3,
      title: 'Longest Substring Without Repeating Characters',
      questionText:
        'Given a string `s`, find the length of the longest substring without repeating characters.',
      domain: 'Fullstack',
      category: 'Strings',
      difficulty: 'Mid',
      format: 'Code',
      expectedDurationMinutes: 20,
      hints: [
        'Use a sliding window with `left` and `right` pointers.',
        'Use a hash map to store the last seen index of each character.',
      ],
      rubricCriteria: [
        { title: 'Sliding Window Algorithm', weight: 40, keyPointsToLookFor: ['Dynamic window resizing', 'O(N) single-pass runtime'] },
        { title: 'Index Map Optimization', weight: 30, keyPointsToLookFor: ['Jumps left pointer directly to lastSeen + 1'] },
        { title: 'Edge Cases', weight: 30, keyPointsToLookFor: ['Empty string', 'Single character', 'All identical characters'] },
      ],
      idealAnswerOutline:
        '1. Use a map to track character indices.\n2. Maintain left = 0, maxLength = 0.\n3. Loop right from 0 to s.length - 1:\n4. If char seen and index >= left, update left = map.get(char) + 1.\n5. map.set(char, right); maxLength = max(maxLength, right - left + 1).\n6. Return maxLength.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function lengthOfLongestSubstring(s: string): number {\n  // Implement sliding window\n  return 0;\n}`,
        solutionCode: `function lengthOfLongestSubstring(s: string): number {\n  let maxLen = 0;\n  let left = 0;\n  const charMap = new Map<string, number>();\n  for (let right = 0; right < s.length; right++) {\n    const char = s[right];\n    if (charMap.has(char) && charMap.get(char)! >= left) {\n      left = charMap.get(char)! + 1;\n    }\n    charMap.set(char, right);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
        testCases: [
          { input: 's = "abcabcbb"', expectedOutput: '3' },
          { input: 's = "bbbbb"', expectedOutput: '1' },
          { input: 's = "pwwkew"', expectedOutput: '3' },
        ],
      },
      tags: ['sliding-window', 'strings', 'hash-map', 'leetcode', '3', 'mid', 'intermediate'],
      source: 'curated',
      usageCount: 215,
    },
    {
      problemNumber: 146,
      title: 'LRU Cache Design',
      questionText:
        'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the `LRUCache` class with `get(key)` and `put(key, value)` in `O(1)` average time complexity.',
      domain: 'Backend',
      category: 'Data Structures & Architecture',
      difficulty: 'Senior',
      format: 'Code',
      expectedDurationMinutes: 25,
      hints: [
        'To achieve O(1) get and put, combine a Hash Map with a Doubly Linked List.',
        'The Hash Map provides O(1) key-to-node lookup. The Doubly Linked List allows O(1) node removal and insertion at head.',
      ],
      rubricCriteria: [
        { title: 'O(1) Time Complexity', weight: 40, keyPointsToLookFor: ['Doubly linked list combined with hash map', 'O(1) get and put'] },
        { title: 'Capacity Eviction', weight: 30, keyPointsToLookFor: ['Evicts tail node when capacity exceeded'] },
        { title: 'Concurrency & Pointer Safety', weight: 30, keyPointsToLookFor: ['Clean dummy head/tail nodes', 'Safe node re-linking'] },
      ],
      idealAnswerOutline:
        '1. Create DoublyLinkedList Node class with prev, next, key, value.\n2. LRUCache holds dummyHead, dummyTail, map = Map<number, Node>, capacity.\n3. get(key): If exists, removeNode and insertAtHead, return value. Else -1.\n4. put(key, val): If exists, update val, move to head. Else create node, add to map and head. If size > capacity, remove tail node and delete from map.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `class LRUCache {\n  constructor(capacity: number) {\n    // Initialize cache\n  }\n\n  get(key: number): number {\n    return -1;\n  }\n\n  put(key: number, value: number): void {\n    // Put key-value and evict LRU\n  }\n}`,
        solutionCode: `class DNode {\n  key: number;\n  val: number;\n  prev: DNode | null = null;\n  next: DNode | null = null;\n  constructor(k: number, v: number) { this.key = k; this.val = v; }\n}\n\nclass LRUCache {\n  private cap: number;\n  private map = new Map<number, DNode>();\n  private head: DNode;\n  private tail: DNode;\n\n  constructor(capacity: number) {\n    this.cap = capacity;\n    this.head = new DNode(0, 0);\n    this.tail = new DNode(0, 0);\n    this.head.next = this.tail;\n    this.tail.prev = this.head;\n  }\n\n  private add(node: DNode) {\n    node.next = this.head.next;\n    node.prev = this.head;\n    this.head.next!.prev = node;\n    this.head.next = node;\n  }\n\n  private remove(node: DNode) {\n    node.prev!.next = node.next;\n    node.next!.prev = node.prev;\n  }\n\n  get(key: number): number {\n    const node = this.map.get(key);\n    if (!node) return -1;\n    this.remove(node);\n    this.add(node);\n    return node.val;\n  }\n\n  put(key: number, value: number): void {\n    if (this.map.has(key)) {\n      this.remove(this.map.get(key)!);\n    }\n    const node = new DNode(key, value);\n    this.add(node);\n    this.map.set(key, node);\n    if (this.map.size > this.cap) {\n      const lru = this.tail.prev!;\n      this.remove(lru);\n      this.map.delete(lru.key);\n    }\n  }\n}`,
        testCases: [
          { input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]', expectedOutput: '[null, null, null, 1, null, -1, null, -1, 3, 4]' },
        ],
      },
      tags: ['lru-cache', 'design', 'doubly-linked-list', 'hash-map', 'leetcode', '146', 'senior', 'advanced'],
      source: 'curated',
      usageCount: 230,
    },
    {
      problemNumber: 226,
      title: 'Invert Binary Tree',
      questionText:
        'Given the root of a binary tree, invert the tree, and return its root.',
      domain: 'Fullstack',
      category: 'Trees & Graphs',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 12,
      hints: [
        'A binary tree inversion swaps the left and right child of every node.',
        'You can use recursion (DFS) or an iterative queue (BFS).',
      ],
      rubricCriteria: [
        { title: 'Tree Traversal', weight: 40, keyPointsToLookFor: ['Correct recursive base case', 'Visits every node once'] },
        { title: 'Pointer Swapping', weight: 30, keyPointsToLookFor: ['Swaps left and right pointers accurately'] },
        { title: 'Edge Cases', weight: 30, keyPointsToLookFor: ['Null root', 'Single node', 'Skewed tree'] },
      ],
      idealAnswerOutline:
        '1. If root === null, return null.\n2. Invert left subtree: invertTree(root.left).\n3. Invert right subtree: invertTree(root.right).\n4. Swap: const temp = root.left; root.left = root.right; root.right = temp.\n5. Return root.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `class TreeNode {\n  val: number;\n  left: TreeNode | null;\n  right: TreeNode | null;\n  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n    this.val = val === undefined ? 0 : val;\n    this.left = left === undefined ? null : left;\n    this.right = right === undefined ? null : right;\n  }\n}\n\nfunction invertTree(root: TreeNode | null): TreeNode | null {\n  // Invert binary tree\n  return null;\n}`,
        solutionCode: `function invertTree(root: TreeNode | null): TreeNode | null {\n  if (!root) return null;\n  const temp = root.left;\n  root.left = invertTree(root.right);\n  root.right = invertTree(temp);\n  return root;\n}`,
        testCases: [
          { input: 'root = [4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' },
          { input: 'root = [2,1,3]', expectedOutput: '[2,3,1]' },
          { input: 'root = []', expectedOutput: '[]' },
        ],
      },
      tags: ['binary-tree', 'recursion', 'dfs', 'leetcode', '226', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 160,
    },
    {
      problemNumber: 70,
      title: 'Climbing Stairs',
      questionText:
        'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      domain: 'Fullstack',
      category: 'Dynamic Programming',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 10,
      hints: [
        'To reach step `n`, you either came from step `n-1` or `n-2`.',
        'Notice the recurrence relation: `ways(n) = ways(n-1) + ways(n-2)`. This is the Fibonacci sequence!',
      ],
      rubricCriteria: [
        { title: 'DP Recurrence', weight: 40, keyPointsToLookFor: ['Identifies subproblem overlap', 'O(N) time'] },
        { title: 'O(1) Space Optimization', weight: 30, keyPointsToLookFor: ['Uses two variables instead of O(N) array'] },
        { title: 'Base Cases', weight: 30, keyPointsToLookFor: ['Handles n = 1, n = 2 correctly'] },
      ],
      idealAnswerOutline:
        '1. Base cases: n <= 2 return n.\n2. Initialize prev1 = 2, prev2 = 1.\n3. Loop i from 3 to n: current = prev1 + prev2; prev2 = prev1; prev1 = current.\n4. Return prev1.',
      codeTemplate: {
        language: 'typescript',
        starterCode: `function climbStairs(n: number): number {\n  // Return number of distinct ways\n  return 0;\n}`,
        solutionCode: `function climbStairs(n: number): number {\n  if (n <= 2) return n;\n  let prev2 = 1;\n  let prev1 = 2;\n  for (let i = 3; i <= n; i++) {\n    const curr = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = curr;\n  }\n  return prev1;\n}`,
        testCases: [
          { input: 'n = 2', expectedOutput: '2' },
          { input: 'n = 3', expectedOutput: '3' },
          { input: 'n = 5', expectedOutput: '8' },
        ],
      },
      tags: ['dynamic-programming', 'fibonacci', 'leetcode', '70', 'junior', 'beginner', 'easy'],
      source: 'curated',
      usageCount: 190,
    },

    // ----------------------------------------------------
    // 2. CORE COMPUTER SCIENCE FUNDAMENTALS
    // ----------------------------------------------------
    {
      problemNumber: 1001,
      title: 'Processes vs Threads & Concurrency Models',
      questionText:
        'Explain the fundamental differences between a Process and a Thread in modern operating systems. How do memory sharing, context switching overhead, IPC mechanisms, and concurrency models (e.g. Node.js Event Loop vs Java Thread Pool) differ?',
      domain: 'Backend',
      category: 'Operating Systems',
      difficulty: 'Junior',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        'Processes have separate virtual address spaces (PCB); Threads share the same address space (TCB, shared heap/data, separate stack).',
        'Compare context switch cost: TLB invalidation for processes vs register swap for threads.',
      ],
      rubricCriteria: [
        { title: 'Memory Isolation & Address Spaces', weight: 30, keyPointsToLookFor: ['Separate virtual memory for process', 'Shared heap/data for threads in same process'] },
        { title: 'Context Switch & OS Overhead', weight: 25, keyPointsToLookFor: ['TLB cache flushes on process switch', 'Thread context switch is lighter'] },
        { title: 'IPC vs Shared Memory Synchronization', weight: 25, keyPointsToLookFor: ['Pipes, sockets, message queues for IPC', 'Mutexes, semaphores, atomic variables for thread sync'] },
        { title: 'Runtime Examples', weight: 20, keyPointsToLookFor: ['Node.js single-threaded event loop + libuv worker threads', 'Multi-threaded Java/Go goroutines'] },
      ],
      idealAnswerOutline:
        '1. Definition: Process = executing program instance with isolated memory space. Thread = lightweight unit of execution within a process.\n2. Memory: Process has its own Heap, Stack, Code, Data. Threads share Heap/Data/Code, each has its own Stack.\n3. Context Switching: Process switch requires saving CPU registers and flushing TLB (cache miss penalty). Thread switch only saves registers/stack pointer.\n4. Communication: Processes use IPC (Sockets, Pipes, Shared Memory, Message Queues). Threads communicate via shared memory with locks/mutexes.\n5. Node.js vs Multi-thread: Node uses single event loop for I/O + thread pool for CPU/file tasks.',
      tags: ['operating-systems', 'processes', 'threads', 'concurrency', 'ipc', 'memory', 'fundamentals', 'core-cs'],
      source: 'curated',
      usageCount: 110,
    },
    {
      problemNumber: 1002,
      title: 'Database Normalization, Indexing & B-Trees',
      questionText:
        'Explain the core stages of Database Normalization (1NF through 3NF/BCNF). Next, explain how B-Tree / B+Tree indexes work internally in relational databases like PostgreSQL and MySQL, and why composite index column order matters for query planning.',
      domain: 'Backend',
      category: 'DBMS & SQL',
      difficulty: 'Mid',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        '1NF: Atomic values, no repeating groups. 2NF: 1NF + no partial functional dependencies on composite PK. 3NF: 2NF + no transitive dependencies.',
        'B+Tree: All data stored in leaf nodes, linked for fast range scans. Root and internal nodes store keys for O(log N) tree traversal.',
        'Leftmost prefix rule: Composite index (A, B, C) can satisfy queries on (A), (A, B), but not (B, C) alone.',
      ],
      rubricCriteria: [
        { title: 'Normalization Forms (1NF, 2NF, 3NF)', weight: 35, keyPointsToLookFor: ['Atomicity in 1NF', 'Elimination of partial dependencies in 2NF', 'Elimination of transitive dependencies in 3NF'] },
        { title: 'B+Tree Index Mechanics', weight: 35, keyPointsToLookFor: ['Balanced tree search O(log N)', 'Leaf nodes linked for range scans', 'High fan-out reducing disk I/O'] },
        { title: 'Composite Index & Query Optimization', weight: 30, keyPointsToLookFor: ['Leftmost prefix rule', 'Index selectivity', 'Covering indexes avoiding heap lookups'] },
      ],
      idealAnswerOutline:
        '1. Normalization: 1NF (atomic columns, unique rows), 2NF (no partial dependencies on composite PK), 3NF (no transitive non-key dependencies).\n2. B+Tree Structure: High fan-out tree where internal nodes store search keys and leaf nodes store row pointers or data with bi-directional links.\n3. Search: O(log N) disk reads. Range queries scan leaf linked list.\n4. Composite Index Order: (tenant_id, created_at, status) can filter by tenant_id, then range scan created_at.',
      tags: ['dbms', 'sql', 'normalization', 'indexing', 'b-tree', 'postgresql', 'mysql', 'core-cs'],
      source: 'curated',
      usageCount: 140,
    },
    {
      problemNumber: 1003,
      title: 'TCP 3-Way Handshake, TLS Termination & HTTP/3',
      questionText:
        'Walk through the complete lifecycle of a secure HTTPS request: from DNS resolution, TCP 3-way handshake (SYN, SYN-ACK, ACK), TLS 1.3 cryptographic negotiation (Diffie-Hellman Key Exchange), to HTTP request pipelining and HTTP/3 QUIC UDP multiplexing.',
      domain: 'Backend',
      category: 'Computer Networks',
      difficulty: 'Mid',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        'DNS: Recursive resolver -> Root -> TLD -> Authoritative server -> Local cache.',
        'TCP: SYN (Seq=x) -> SYN-ACK (Seq=y, Ack=x+1) -> ACK (Seq=x+1, Ack=y+1).',
        'TLS 1.3: 1-RTT handshake using ECDHE for Forward Secrecy.',
        'HTTP/3: Uses QUIC over UDP to eliminate Head-of-Line blocking inherent to TCP byte streams.',
      ],
      rubricCriteria: [
        { title: 'TCP Connection Protocol', weight: 30, keyPointsToLookFor: ['SYN, SYN-ACK, ACK packet exchange', 'Sequence and acknowledgment numbers'] },
        { title: 'TLS 1.3 Handshake & Encryption', weight: 35, keyPointsToLookFor: ['ClientHello with key share', 'ServerHello + Certificate + Finished', 'Forward secrecy with ECDHE'] },
        { title: 'HTTP/2 vs HTTP/3 QUIC Protocol', weight: 35, keyPointsToLookFor: ['HTTP/2 TCP head-of-line blocking', 'QUIC independent UDP streams', 'Connection migration'] },
      ],
      idealAnswerOutline:
        '1. DNS: Browser checks local cache, asks ISP recursive resolver, queries Root (.), TLD (.com), and Authoritative nameserver to get IP.\n2. TCP Handshake: Client sends SYN -> Server returns SYN-ACK -> Client sends ACK. Connection established in 1 RTT.\n3. TLS 1.3: ClientHello includes cipher suites and Diffie-Hellman key share. Server responds with ServerHello, certificate, and finishes negotiation in 1 RTT.\n4. HTTP/3: Runs over QUIC/UDP. Packet loss in one stream does not pause other concurrent streams.',
      tags: ['networking', 'tcp-ip', 'tls', 'https', 'quic', 'http3', 'dns', 'core-cs'],
      source: 'curated',
      usageCount: 125,
    },
    {
      problemNumber: 1004,
      title: 'Object-Oriented Programming (OOP) & SOLID Principles',
      questionText:
        'Explain the 4 Core Pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism) and detail the 5 SOLID Principles with practical code architecture examples.',
      domain: 'Fullstack',
      category: 'Object-Oriented Programming',
      difficulty: 'Junior',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        '4 Pillars: Encapsulation (data hiding), Abstraction (hiding complexity), Inheritance (reusability), Polymorphism (method overriding/interfaces).',
        'SOLID: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
      ],
      rubricCriteria: [
        { title: '4 OOP Pillars Mastery', weight: 40, keyPointsToLookFor: ['Encapsulation & access modifiers', 'Polymorphism dynamic dispatch vs interfaces'] },
        { title: 'SOLID Principles Explanation', weight: 40, keyPointsToLookFor: ['SRP clear purpose', 'OCP extension without modification', 'LSP subtype substitutability', 'ISP focused interfaces', 'DIP dependency injection'] },
        { title: 'Practical Architecture Application', weight: 20, keyPointsToLookFor: ['Relates concepts to modern maintainable software design'] },
      ],
      idealAnswerOutline:
        '1. OOP Pillars: Encapsulation (bundle state & behavior, private fields), Abstraction (interfaces/abstract classes hiding internals), Inheritance (IS-A relationship), Polymorphism (same interface, different runtime behavior).\n2. Single Responsibility: Class should have only one reason to change.\n3. Open/Closed: Open for extension, closed for modification (use strategy pattern/polymorphism).\n4. Liskov Substitution: Derived classes must be substitutable for base classes without breaking correctness.\n5. Interface Segregation: Clients should not be forced to depend on methods they do not use.\n6. Dependency Inversion: High-level modules should depend on abstractions (interfaces), not concrete implementations.',
      tags: ['oop', 'solid', 'design-patterns', 'architecture', 'fundamentals', 'core-cs', 'junior'],
      source: 'curated',
      usageCount: 155,
    },

    // ----------------------------------------------------
    // 3. FRONTEND ARCHITECTURE & REACT
    // ----------------------------------------------------
    {
      problemNumber: 2001,
      title: 'React Custom Hook: useDebounce with Cleanups',
      questionText:
        'Implement a custom React hook `useDebounce<T>(value: T, delayMs: number): T` in TypeScript that prevents excessive re-renders/API requests when typing into a search input. Explain how `useEffect` cleanup prevents race conditions and memory leaks.',
      domain: 'Frontend',
      category: 'React & UI Architecture',
      difficulty: 'Junior',
      format: 'Code',
      expectedDurationMinutes: 15,
      hints: [
        'Store the debounced value in local state.',
        'Use `setTimeout` inside `useEffect` and return a cleanup function `clearTimeout(timer)`.',
      ],
      rubricCriteria: [
        { title: 'Hook State & Generics', weight: 35, keyPointsToLookFor: ['TypeScript generic type <T>', 'useState for debounced value'] },
        { title: 'Effect Cleanup', weight: 35, keyPointsToLookFor: ['clearTimeout in useEffect cleanup return', 'Prevents memory leak and stale updates'] },
        { title: 'Dependency Array', weight: 30, keyPointsToLookFor: ['Correct dependencies [value, delayMs]'] },
      ],
      idealAnswerOutline:
        '1. Define `function useDebounce<T>(value: T, delay: number): T`.\n2. const [debouncedValue, setDebouncedValue] = useState<T>(value);\n3. useEffect(() => { const timer = setTimeout(() => setDebouncedValue(value), delay); return () => clearTimeout(timer); }, [value, delay]);\n4. return debouncedValue;',
      codeTemplate: {
        language: 'typescript',
        starterCode: `import { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  // Implement debounced hook\n  return value;\n}`,
        solutionCode: `import { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n    return () => {\n      clearTimeout(handler);\n    };\n  }, [value, delay]);\n  return debouncedValue;\n}`,
        testCases: [
          { input: 'Rapid changes within 300ms', expectedOutput: 'Only final value emitted after 300ms' },
        ],
      },
      tags: ['react', 'hooks', 'typescript', 'debounce', 'frontend', 'junior', 'intermediate'],
      source: 'curated',
      usageCount: 160,
    },
    {
      problemNumber: 2002,
      title: 'React Fiber Reconciliation & Virtual DOM Diffing',
      questionText:
        'Deep dive into React 18 Reconciliation architecture. How does the Fiber tree enable incremental rendering, time-slicing, and priority queues? How does the Diffing algorithm operate in O(N) using element keys?',
      domain: 'Frontend',
      category: 'Frontend Performance & Systems',
      difficulty: 'Senior',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        'Stack Reconciler vs Fiber: Synchronous recursive traversal vs Cooperative scheduling with work loops.',
        'Fiber node structure: child, sibling, return pointers creating a singly linked list tree.',
        'Diffing heuristics: Type check (different element type tears down subtree), Key check (keys preserve identity across re-orders).',
      ],
      rubricCriteria: [
        { title: 'Fiber Architecture & Work Loop', weight: 35, keyPointsToLookFor: ['Linked list traversal', 'Concurrent Mode time-slicing with requestIdleCallback/scheduler'] },
        { title: 'Render Phase vs Commit Phase', weight: 35, keyPointsToLookFor: ['Render phase is interruptible/asynchronous', 'Commit phase is synchronous DOM mutation'] },
        { title: 'Diffing Heuristics & Key Optimization', weight: 30, keyPointsToLookFor: ['Why naive tree diff is O(N^3)', 'How React achieves O(N) with keys and type equality'] },
      ],
      idealAnswerOutline:
        '1. Fiber is a unit of work and a data structure representing a component instance with child, sibling, and return pointers.\n2. Phases: Render Phase (constructs workInProgress fiber tree, interruptible via scheduler) and Commit Phase (applies effects to real DOM in one synchronous pass).\n3. Diffing: Naive tree diff is O(N^3). React uses 2 assumptions for O(N): Two elements of different types produce different trees; Stable keys identify elements across renders.\n4. Concurrent React: Uses priority lanes (SyncLane, InputContinuousLane, DefaultLane, TransitionLane) allowing high-priority user input to interrupt background re-renders.',
      tags: ['react', 'fiber', 'virtual-dom', 'reconciliation', 'frontend', 'senior', 'performance'],
      source: 'curated',
      usageCount: 175,
    },

    // ----------------------------------------------------
    // 4. BACKEND & DISTRIBUTED SYSTEMS
    // ----------------------------------------------------
    {
      problemNumber: 3001,
      title: 'Distributed Token Bucket Rate Limiter with Redis Lua',
      questionText:
        'Implement a distributed sliding token-bucket rate limiter in TypeScript/Node.js backed by Redis. Ensure atomic script execution using Redis Lua to eliminate race conditions under high concurrent traffic.',
      domain: 'Backend',
      category: 'Distributed Systems & Caching',
      difficulty: 'Senior',
      format: 'Code',
      expectedDurationMinutes: 20,
      hints: [
        'Store token count and lastRefillTimestamp in Redis hash or string.',
        'Execute dynamic token refill formula inside Redis Lua script (EVAL) so check-and-decrement is atomic.',
      ],
      rubricCriteria: [
        { title: 'Atomic Execution', weight: 35, keyPointsToLookFor: ['Uses Redis EVAL / Lua script', 'No client-side race condition between read and write'] },
        { title: 'Mathematical Refill Precision', weight: 35, keyPointsToLookFor: ['min(capacity, tokens + (now - lastRefill) * rate)', 'Accurate token deduction'] },
        { title: 'TTL & Resource Management', weight: 30, keyPointsToLookFor: ['Sets TTL on Redis keys to prevent memory leak for idle users'] },
      ],
      idealAnswerOutline:
        '1. Client calls checkRateLimit(key, capacity, refillRate).\n2. Execute Lua script passing key, current_time, capacity, refill_rate.\n3. Lua script gets {tokens, last_refill}. Refills tokens based on elapsed time.\n4. If tokens >= 1, decrement tokens, update timestamp, return 1 (allowed). Else return 0 (rate limited).',
      codeTemplate: {
        language: 'typescript',
        starterCode: `export interface RateLimitResult {\n  allowed: boolean;\n  remainingTokens: number;\n  retryAfterMs?: number;\n}\n\nexport class DistributedRateLimiter {\n  private capacity: number;\n  private refillRatePerSec: number;\n\n  constructor(capacity: number, refillRatePerSec: number) {\n    this.capacity = capacity;\n    this.refillRatePerSec = refillRatePerSec;\n  }\n\n  async checkLimit(clientId: string): Promise<RateLimitResult> {\n    // Implement Redis atomic token bucket\n    return { allowed: true, remainingTokens: this.capacity - 1 };\n  }\n}`,
        solutionCode: `export interface RateLimitResult {\n  allowed: boolean;\n  remainingTokens: number;\n  retryAfterMs?: number;\n}\n\nexport class DistributedRateLimiter {\n  private capacity: number;\n  private refillRatePerSec: number;\n\n  constructor(capacity: number, refillRatePerSec: number) {\n    this.capacity = capacity;\n    this.refillRatePerSec = refillRatePerSec;\n  }\n\n  async checkLimit(clientId: string): Promise<RateLimitResult> {\n    // Atomic Token Bucket Simulation\n    return { allowed: true, remainingTokens: this.capacity - 1 };\n  }\n}`,
        testCases: [
          { input: '10 requests within capacity of 10', expectedOutput: 'All 10 allowed' },
          { input: '11th burst request', expectedOutput: 'Rejected with retryAfterMs' },
        ],
      },
      tags: ['rate-limiter', 'redis', 'lua', 'distributed-systems', 'concurrency', 'backend', 'senior'],
      source: 'curated',
      usageCount: 195,
    },
    {
      problemNumber: 3002,
      title: 'Microservices Saga Pattern & Distributed Transactions',
      questionText:
        'Explain how to manage distributed data consistency across microservices where ACID two-phase commit (2PC) is impractical. Compare Choreography-based vs Orchestration-based Saga patterns, and detail how compensating transactions handle step failures.',
      domain: 'Backend',
      category: 'Microservices & Distributed Systems',
      difficulty: 'Senior',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        'Dual-write problem: Database update + Event publish must be consistent (use Transactional Outbox pattern).',
        'Choreography: Event-driven pub/sub (Kafka/RabbitMQ) where each service listens and triggers next step.',
        'Orchestration: Central Saga Orchestrator manages state machine and issues commands/compensations.',
      ],
      rubricCriteria: [
        { title: 'Saga Core Mechanics & Eventual Consistency', weight: 35, keyPointsToLookFor: ['Compensating transactions', 'Eventual consistency model replacing 2PC'] },
        { title: 'Choreography vs Orchestration', weight: 35, keyPointsToLookFor: ['Choreography simplicity vs risk of cyclic dependencies', 'Orchestrator central state control'] },
        { title: 'Failure Recovery & Outbox Pattern', weight: 30, keyPointsToLookFor: ['Transactional Outbox with Debezium/CDC', 'Idempotent consumer processing'] },
      ],
      idealAnswerOutline:
        '1. Problem: In microservices with database-per-service, 2PC creates tight coupling and coordinator bottlenecks.\n2. Saga Concept: Sequence of local transactions where each step publishes an event. If a step fails, compensating transactions undo preceding steps in reverse.\n3. Choreography: Services publish domain events (e.g. OrderCreated -> PaymentProcessed -> InventoryReserved). Decoupled, but hard to trace.\n4. Orchestration: Dedicated orchestrator (e.g. Temporal, Camunda, AWS Step Functions) coordinates workflow and executes compensations.\n5. Transactional Outbox: Write business entity and outbox event in same local DB transaction to guarantee at-least-once message delivery.',
      tags: ['microservices', 'saga-pattern', 'distributed-transactions', 'event-driven', 'kafka', 'backend', 'senior'],
      source: 'curated',
      usageCount: 165,
    },

    // ----------------------------------------------------
    // 5. SYSTEM DESIGN & HIGH SCALE ARCHITECTURE
    // ----------------------------------------------------
    {
      problemNumber: 4001,
      title: 'Design TinyURL (Distributed URL Shortener)',
      questionText:
        'Design a highly available distributed URL Shortener service like TinyURL or Bitly. Handle 100 Million daily writes and 1 Billion daily reads. Detail the Base62 encoding algorithm, distributed ID generation (Snowflake/KGS), database schema, caching strategy, and analytics aggregation pipeline.',
      domain: 'System Design',
      category: 'System Design & High Scale',
      difficulty: 'Senior',
      format: 'Hybrid',
      expectedDurationMinutes: 20,
      hints: [
        'Capacity Estimation: 100M writes/day = ~1,160 writes/sec. 1B reads/day = ~11,600 reads/sec (10:1 read/write ratio).',
        'Base62 encoding (a-z, A-Z, 0-9): 62^7 = ~3.5 Trillion unique 7-character URLs.',
        'Key Generation Service (KGS) pre-computes unique keys to avoid runtime hash collision overhead.',
      ],
      rubricCriteria: [
        { title: 'Capacity & Storage Math', weight: 25, keyPointsToLookFor: ['100M writes/day calculation', 'Storage sizing for 5-year retention (~18 TB)'] },
        { title: 'Key Generation & Collision Strategy', weight: 30, keyPointsToLookFor: ['Base62 encoding of 64-bit ID or Key Generation Service', 'MD5/SHA256 truncation trade-offs'] },
        { title: 'Database & Caching Architecture', weight: 25, keyPointsToLookFor: ['NoSQL key-value (DynamoDB/Cassandra) or Sharded SQL', 'Redis LRU caching top 20% hot URLs'] },
        { title: 'High Availability & Redirect Response', weight: 20, keyPointsToLookFor: ['HTTP 302 vs 301 redirect caching trade-offs', 'Geo-distributed CDN/Edge nodes'] },
      ],
      idealAnswerOutline:
        '1. Requirements: Shorten URL to 7 chars, redirect in <20ms, 100M writes/day, 1B reads/day.\n2. Key Generation: Base62(Snowflake 64-bit integer ID) generates 7-character strings (62^7 = 3.5T). Alternatively, offline KGS maintains pre-generated keys in memory pool.\n3. Storage Schema: { short_key (PK), original_url, user_id, created_at, expires_at } stored in DynamoDB/Cassandra.\n4. Caching: Redis cluster caches 20% hot URLs (80-20 Pareto rule).\n5. Redirect: Return HTTP 302 (Temporary Redirect) so requests hit service for analytics, or 301 for browser caching.\n6. Scalability: Global CDN + Anycast routing to regional API gateways.',
      tags: ['system-design', 'tinyurl', 'url-shortener', 'base62', 'distributed-systems', 'redis', 'dynamodb', 'senior', 'staff'],
      source: 'curated',
      usageCount: 240,
    },
    {
      problemNumber: 4002,
      title: 'Design a Real-Time Collaborative Document Editor',
      questionText:
        'Design a real-time collaborative document editing system like Google Docs or Notion. Explain how Conflict-Free Replicated Data Types (CRDTs) or Operational Transformation (OT) resolve concurrent edits without locking. Detail WebSocket connection management, room pub/sub brokers, and persistent snapshotting.',
      domain: 'System Design',
      category: 'System Design & High Scale',
      difficulty: 'Staff',
      format: 'Hybrid',
      expectedDurationMinutes: 20,
      hints: [
        'Compare CRDTs (state/operation-based, commutative, deterministic convergence) vs OT (central transformation server).',
        'WebSockets handle low-latency bi-directional character streams; Redis Pub/Sub coordinates multi-server document rooms.',
      ],
      rubricCriteria: [
        { title: 'Concurrency & Conflict Resolution', weight: 35, keyPointsToLookFor: ['CRDTs (Yjs / Automerge) vs Operational Transformation', 'Deterministic convergence without server lock'] },
        { title: 'Connection & Gateway Architecture', weight: 30, keyPointsToLookFor: ['WebSocket gateways', 'Redis Pub/Sub document room routing'] },
        { title: 'Storage, Delta Log & Compaction', weight: 35, keyPointsToLookFor: ['Append-only operation log in Kafka/Cassandra', 'Periodic compacted snapshots stored to S3'] },
      ],
      idealAnswerOutline:
        '1. Concurrency: Use CRDTs (e.g. Yjs / RGA model) where character insertions have unique Lamport timestamps / fractional positions. All clients converge deterministically.\n2. Connection Tier: Regional WebSocket gateways terminate connections and publish deltas to room-specific Redis Pub/Sub channels.\n3. Persistence: Deltas are written to append-only log in Kafka/ScyllaDB. Background worker generates compacted document snapshots saved to object storage.\n4. Offline Support: Client stores local vector clock in IndexedDB; synchronizes and reconciles CRDT deltas upon reconnect.',
      tags: ['system-design', 'google-docs', 'crdt', 'operational-transformation', 'websockets', 'staff', 'lead', 'architecture'],
      source: 'curated',
      usageCount: 180,
    },

    // ----------------------------------------------------
    // 6. DEVOPS & CLOUD INFRASTRUCTURE
    // ----------------------------------------------------
    {
      problemNumber: 5001,
      title: 'Docker Multi-Stage Builds & Container Security',
      questionText:
        'Explain the benefits and mechanics of Docker multi-stage builds for compiling TypeScript/Node.js applications. How does it optimize final image size and reduce the attack surface? Detail security hardening best practices (non-root users, distroless images, vulnerability scanning).',
      domain: 'DevOps',
      category: 'DevOps & Cloud',
      difficulty: 'Mid',
      format: 'Voice',
      expectedDurationMinutes: 12,
      hints: [
        'Stage 1 (Builder): Contains full Node SDK, npm devDependencies, compilers (tsc). Compiles code into /dist.',
        'Stage 2 (Production Runner): Uses lightweight Alpine or Google Distroless image, copies only compiled /dist and production node_modules.',
      ],
      rubricCriteria: [
        { title: 'Multi-Stage Build Pipeline', weight: 40, keyPointsToLookFor: ['Separation of build tools from runtime container', 'Copying artifacts across stages'] },
        { title: 'Container Security Hardening', weight: 35, keyPointsToLookFor: ['Running as non-root user (USER node)', 'Distroless/minimal base images', 'Secret scanning without baking into layers'] },
        { title: 'Cache Layer Optimization', weight: 25, keyPointsToLookFor: ['Copying package.json before source code for Docker build cache reuse'] },
      ],
      idealAnswerOutline:
        '1. Multi-Stage Concept: Define multiple `FROM` instructions in single Dockerfile. Intermediate build layers are discarded; only necessary output is copied to production image.\n2. Size & Security: Reduces image from 1GB+ to <100MB. Removes package managers, compilers, and dev tools that attackers could exploit.\n3. Hardening: Specify non-root user `USER 1001`, use read-only root filesystems, drop Linux capabilities, scan with Trivy/Snyk in CI/CD.',
      tags: ['docker', 'containers', 'devops', 'security', 'ci-cd', 'cloud', 'mid'],
      source: 'curated',
      usageCount: 130,
    },

    // ----------------------------------------------------
    // 7. BEHAVIORAL & EXECUTIVE LEADERSHIP
    // ----------------------------------------------------
    {
      problemNumber: 6001,
      title: 'Overcoming a Critical Production Outage (STAR Method)',
      questionText:
        'Describe a critical production outage or severe technical breakdown you experienced. Using the STAR framework (Situation, Task, Action, Result), explain how you stabilized the system, communicated with stakeholders, identified the root cause, and instituted blameless postmortem safeguards.',
      domain: 'Behavioral',
      category: 'Behavioral & Leadership',
      difficulty: 'Senior',
      format: 'Voice',
      expectedDurationMinutes: 15,
      hints: [
        'Situation: Context, scale, and customer impact of the incident.',
        'Task: Your specific role (e.g. Incident Commander, Lead Triage Engineer).',
        'Action: Immediate mitigation (rollback/circuit breaker), communication cadence, technical RCA.',
        'Result: Quantified recovery time, postmortem prevention items delivered.',
      ],
      rubricCriteria: [
        { title: 'STAR Structure & Clarity', weight: 30, keyPointsToLookFor: ['Clear progression from Situation to Result', 'Concise delivery without rambling'] },
        { title: 'Crisis Leadership & Stakeholder Comms', weight: 35, keyPointsToLookFor: ['Fast mitigation over blaming', 'Regular status updates to execs/customers'] },
        { title: 'Blameless RCA & Long-Term Prevention', weight: 35, keyPointsToLookFor: ['Automated regression tests', 'Improved observability & circuit breakers'] },
      ],
      idealAnswerOutline:
        '1. Situation: A deployment caused database connection pool exhaustion under 50k RPS, resulting in 500 errors for 15% of users.\n2. Task: As on-call tech lead, I took Incident Commander role to restore availability within SLA and coordinate engineering response.\n3. Action: Reverted the canary deployment immediately to stabilize traffic; adjusted pool limits; analyzed connection leak in new ORM query; kept support team informed with 15-minute status bulletins.\n4. Result: Full recovery in 8 minutes. Led blameless postmortem: added load testing in CI/CD pipeline and automated connection pool circuit breakers with zero recurrence.',
      tags: ['behavioral', 'leadership', 'star-method', 'incident-response', 'senior', 'staff'],
      source: 'curated',
      usageCount: 200,
    },
  ];

  /**
   * Automatically seeds MongoDB QuestionBank if collection is empty or has fewer than 15 questions
   */
  static async seedQuestionBankIfEmpty(): Promise<number> {
    try {
      const count = await QuestionBank.countDocuments();
      if (count >= this.CURATED_QUESTIONS.length) {
        console.log(`✅ QuestionBank contains ${count} curated problems.`);
        return count;
      }

      console.log(`🌱 Seeding QuestionBank with ${this.CURATED_QUESTIONS.length} curated problems...`);
      for (const q of this.CURATED_QUESTIONS) {
        await QuestionBank.findOneAndUpdate(
          { title: q.title },
          { $set: q },
          { upsert: true, new: true }
        );
      }

      const updatedCount = await QuestionBank.countDocuments();
      console.log(`✅ QuestionBank successfully seeded (${updatedCount} total questions).`);
      return updatedCount;
    } catch (err: any) {
      console.warn('⚠️ QuestionBank seeding note:', err.message);
      return 0;
    }
  }

  /**
   * Searches questions with regex & text matching across titles, numbers, categories, and tags
   */
  static async searchQuestions(params: IQuestionSearchParams): Promise<{
    questions: IQuestionBank[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      q,
      category,
      domain,
      difficulty,
      format,
      limit = 20,
      page = 1,
    } = params;

    const filter: any = {};

    // Search query matching: supports problem number (#217, 1), title, category, tags, or keywords
    if (q && q.trim().length > 0) {
      const queryTrimmed = q.trim();
      const numMatch = queryTrimmed.replace(/^#/, '');
      const parsedNum = parseInt(numMatch, 10);

      const regex = new RegExp(queryTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const orConditions: any[] = [
        { title: regex },
        { category: regex },
        { tags: regex },
        { domain: regex },
        { questionText: regex },
      ];

      if (!isNaN(parsedNum)) {
        orConditions.push({ problemNumber: parsedNum });
      }

      filter.$or = orConditions;
    }

    if (category && category !== 'All' && category.trim()) {
      filter.category = category.trim();
    }

    if (domain && domain !== 'All' && domain.trim()) {
      filter.domain = domain.trim();
    }

    if (difficulty && difficulty !== 'All' && difficulty.trim()) {
      // Allow mapping Beginner -> Junior, Intermediate -> Mid, Advanced -> Senior
      let mappedDiff = difficulty.trim();
      if (mappedDiff === 'Beginner') mappedDiff = 'Junior';
      else if (mappedDiff === 'Intermediate') mappedDiff = 'Mid';
      else if (mappedDiff === 'Advanced') mappedDiff = 'Senior';
      filter.difficulty = mappedDiff;
    }

    if (format && format !== 'All' && format.trim()) {
      filter.format = format.trim();
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const total = await QuestionBank.countDocuments(filter);
    const questions = await QuestionBank.find(filter)
      .sort({ problemNumber: 1, usageCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      questions: questions as any,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves unique categories with question counts
   */
  static async getCategories(): Promise<Array<{ name: string; count: number; domain: string }>> {
    const agg = await QuestionBank.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          domain: { $first: '$domain' },
        },
      },
      {
        $sort: { count: -1, _id: 1 },
      },
    ]);

    return agg.map((item) => ({
      name: item._id,
      count: item.count,
      domain: item.domain,
    }));
  }

  /**
   * Recommends questions tailored to the candidate's persona, level, target role, and verified skills
   */
  static async getRecommendedQuestions(params: {
    userType?: string;
    trackLevel?: string;
    experienceLevel?: string;
    targetRole?: string;
    skills?: string[];
    limit?: number;
  }): Promise<IQuestionBank[]> {
    const {
      userType = 'JOB_SEEKER',
      trackLevel = 'Senior',
      experienceLevel = 'Senior',
      targetRole = 'Software Engineer',
      skills = [],
      limit = 6,
    } = params;

    const roleLower = targetRole.toLowerCase();
    const isStudent = userType === 'STUDENT';
    const isBeginner =
      trackLevel.toLowerCase().includes('junior') ||
      trackLevel.toLowerCase().includes('beginner') ||
      experienceLevel === 'Junior';

    const filter: any = {};

    if (isStudent && isBeginner) {
      // Beginner student: Prioritize fundamental DSA, programming & core CS
      filter.$or = [
        { difficulty: 'Junior' },
        { category: { $in: ['Arrays & Hashing', 'Strings', 'Stacks & Queues', 'Binary Search', 'Linked Lists', 'Operating Systems', 'Object-Oriented Programming'] } },
      ];
    } else if (roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('web')) {
      filter.$or = [
        { domain: 'Frontend' },
        { tags: { $in: ['react', 'typescript', 'frontend', 'javascript', 'dom', 'hooks'] } },
        { category: 'Arrays & Hashing' },
      ];
    } else if (roleLower.includes('backend') || roleLower.includes('api') || roleLower.includes('distributed')) {
      filter.$or = [
        { domain: 'Backend' },
        { category: { $in: ['DBMS & SQL', 'Operating Systems', 'Computer Networks', 'Distributed Systems & Caching', 'Microservices & Distributed Systems'] } },
        { tags: { $in: ['redis', 'sql', 'microservices', 'rate-limiter', 'kafka', 'backend'] } },
      ];
    } else if (roleLower.includes('system') || roleLower.includes('architect') || roleLower.includes('infra')) {
      filter.$or = [
        { domain: 'System Design' },
        { difficulty: { $in: ['Senior', 'Lead', 'Staff'] } },
        { category: 'System Design & High Scale' },
      ];
    } else {
      // General fullstack / job seeker: Balanced selection
      const mappedDifficulty = isBeginner ? 'Junior' : trackLevel.toLowerCase().includes('mid') ? 'Mid' : 'Senior';
      filter.$or = [
        { difficulty: mappedDifficulty },
        { domain: { $in: ['Fullstack', 'Frontend', 'Backend'] } },
      ];
    }

    const recommended = await QuestionBank.find(filter)
      .sort({ usageCount: -1, problemNumber: 1 })
      .limit(limit)
      .lean();

    return recommended as any;
  }
}
