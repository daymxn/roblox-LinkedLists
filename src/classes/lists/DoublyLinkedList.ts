import { DoublyLinkedListNode } from "../nodes/DoublyLinkedListNode";
import { IDoublyLinkedList } from "../../interfaces/IDoublyLinkedList";
import { IReadonlyLinkedList } from "../../interfaces/IReadonlyLinkedList";
import { IDoublyLinkedListNode } from "../../interfaces/IDoublyLinkedListNode";

export class DoublyLinkedList<T extends defined> implements IDoublyLinkedList<T> {
	protected headNode?: IDoublyLinkedListNode<T>;
	protected tailNode?: IDoublyLinkedListNode<T>;
	protected numberOfNodes = 0;

	public clear() {
		this.headNode = undefined;
		this.tailNode = undefined;
		this.numberOfNodes = 0;
	}

	public copyLinkedListValuesToHead(valuesList: IReadonlyLinkedList<T>) {
		if (valuesList.isEmpty()) {
			return;
		}

		const priorHeadNode = this.headNode;

		let mostRecentNode: IDoublyLinkedListNode<T> | undefined;

		// use tuple iterator to ensure circular lists are handled properly
		for (const [_, value] of valuesList.getForwardIterator()) {
			const newestNode = new DoublyLinkedListNode(value);

			if (mostRecentNode === undefined) {
				newestNode.nextNode = priorHeadNode;
				this.headNode = newestNode;
			} else {
				newestNode.nextNode = priorHeadNode;
				newestNode.previousNode = mostRecentNode;
				mostRecentNode.nextNode = newestNode;
			}

			mostRecentNode = newestNode;
		}

		if (priorHeadNode !== undefined) {
			priorHeadNode.previousNode = mostRecentNode;
		}

		if (this.tailNode === undefined) {
			this.tailNode = mostRecentNode;
		}

		this.numberOfNodes += valuesList.size();
	}

	public copyLinkedListValuesToIndex(index: number, valuesList: IReadonlyLinkedList<T>) {
		if (index < 1) {
			throw `Provided index, ${index}, is less than 1`;
		}

		if (index > this.numberOfNodes + 1) {
			throw `Provided index, ${index}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		if (valuesList.isEmpty()) {
			return;
		}

		if (index === 1) {
			// just the same as pushing to head
			this.copyLinkedListValuesToHead(valuesList);
			return;
		}

		if (index === this.numberOfNodes + 1) {
			// just the same as pushing to tail
			this.copyLinkedListValuesToTail(valuesList);
			return;
		}

		let previousNode = this.headNode!; // at this point we know this isn't pushing to be the head node and the list is not empty
		for (const [currentIndex, currentNode] of this.getForwardIndexAndNodeTupleIterator()) {
			if (currentIndex === index) {
				// use tuple iterator to ensure circular lists are handled properly
				for (const [_, value] of valuesList.getForwardIterator()) {
					const newNode = new DoublyLinkedListNode(value);

					previousNode.nextNode = newNode;
					newNode.previousNode = previousNode;
					newNode.nextNode = currentNode;
					currentNode.previousNode = newNode;

					previousNode = newNode;
				}
				this.numberOfNodes += valuesList.size();

				return;
			} else {
				previousNode = currentNode;
			}
		}

		// should never get here
		throw `Somehow failed to find index, ${index}, even though it is in bounds`;
	}

	public copyLinkedListValuesToTail(valuesList: IReadonlyLinkedList<T>) {
		if (valuesList.isEmpty()) {
			return;
		}

		let mostRecentNode = this.tailNode;

		// use tuple iterator to ensure circular lists are handled properly
		for (const [_, value] of valuesList.getForwardIterator()) {
			const newestNode = new DoublyLinkedListNode(value);

			if (mostRecentNode === undefined) {
				// the list was empty before this
				this.headNode = newestNode;
			} else {
				newestNode.previousNode = mostRecentNode;
				mostRecentNode.nextNode = newestNode;
			}

			mostRecentNode = newestNode;
		}

		this.tailNode = mostRecentNode;

		this.numberOfNodes += valuesList.size();
	}

	public copyValuesToSubList(startIndex: number, endIndex: number): DoublyLinkedList<T> {
		return this.doCopyValuesToSubList(startIndex, endIndex, new DoublyLinkedList());
	}

	public getBackwardIterator() {
		const iterateNodes = this.getBackwardIndexAndNodeTupleIterator();

		return (() => {
			const [index, nextNode] = iterateNodes();
			if (nextNode?.value === undefined) {
				return undefined;
			} else {
				return [index, nextNode.value] as LuaTuple<[number, T]>;
			}
		}) as IterableFunction<LuaTuple<[number, T]>>;
	}

	public getBackwardValuesIterator() {
		const iterateNodes = this.getBackwardIndexAndNodeTupleIterator();

		return (() => {
			const [_, nextNode] = iterateNodes();
			return nextNode?.value;
		}) as IterableFunction<T>;
	}

	public getForwardIterator() {
		const iterateNodes = this.getForwardIndexAndNodeTupleIterator();

		return (() => {
			const [index, nextNode] = iterateNodes();
			if (nextNode?.value === undefined) {
				return undefined;
			} else {
				return [index, nextNode.value] as LuaTuple<[number, T]>;
			}
		}) as IterableFunction<LuaTuple<[number, T]>>;
	}

	public getForwardValuesIterator() {
		const iterateNodes = this.getForwardIndexAndNodeTupleIterator();

		return (() => {
			const [_, nextNode] = iterateNodes();
			return nextNode?.value;
		}) as IterableFunction<T>;
	}

	public isEmpty() {
		return this.headNode === undefined;
	}

	/**
	 * Moves the nodes from the input list into this list at the head of this list,
	 * such that the head of the input list is the new head of this list and all other
	 * nodes follow in order and the previous head of this list is attached as the
	 * next node following the tail of the input list and vice versa.
	 * The input list is cleared in the process.
	 * @param otherDoublyLinkedList The input list
	 */
	public moveNodesFromDoublyLinkedListToHead(otherDoublyLinkedList: DoublyLinkedList<T>) {
		if (otherDoublyLinkedList.isEmpty()) {
			return;
		}

		const priorHeadNode = this.headNode;

		this.headNode = otherDoublyLinkedList.headNode;
		otherDoublyLinkedList.tailNode!.nextNode = priorHeadNode;

		if (priorHeadNode === undefined) {
			// this list was empty
			this.tailNode = otherDoublyLinkedList.tailNode;
		} else {
			priorHeadNode.previousNode = otherDoublyLinkedList.tailNode;
		}

		this.numberOfNodes += otherDoublyLinkedList.numberOfNodes;

		otherDoublyLinkedList.clear();
	}

	/**
	 * Moves the nodes from the input list into this list at the given index in this list,
	 * such that the head of the input list is now at the given index of this list and all other
	 * nodes follow in order and the previous node, if any, at the given index of this list is
	 * attached as the next node following the tail of the input list and vice versa.
	 * The input list is cleared in the process.
	 * @param otherDoublyLinkedList The input list
	 */
	public moveNodesFromDoublyLinkedListToIndex(index: number, otherDoublyLinkedList: DoublyLinkedList<T>) {
		if (index < 1) {
			throw `Provided index, ${index}, is less than 1`;
		}

		if (index > this.numberOfNodes + 1) {
			throw `Provided index, ${index}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		if (otherDoublyLinkedList.isEmpty()) {
			return;
		}

		if (index === 1) {
			// same as moving to head
			this.moveNodesFromDoublyLinkedListToHead(otherDoublyLinkedList);
			return;
		}

		if (index === this.numberOfNodes + 1) {
			// same as moving to tail
			this.moveNodesFromDoublyLinkedListToTail(otherDoublyLinkedList);
			return;
		}

		let previousNode = this.headNode!; // at this point we know this isn't pushing to be the head node and the list is not empty
		for (const [currentIndex, currentNode] of this.getForwardIndexAndNodeTupleIterator()) {
			if (currentIndex === index) {
				previousNode.nextNode = otherDoublyLinkedList.headNode;
				otherDoublyLinkedList.headNode!.previousNode = previousNode;
				otherDoublyLinkedList.tailNode!.nextNode = currentNode;
				currentNode.previousNode = otherDoublyLinkedList.tailNode;

				this.numberOfNodes += otherDoublyLinkedList.numberOfNodes;

				otherDoublyLinkedList.clear();

				return;
			} else {
				previousNode = currentNode;
			}
		}

		// should never get here
		throw `Somehow failed to find index, ${index}, even though it is in bounds`;
	}

	/**
	 * Moves the nodes from the input list into this list at the tail of this list,
	 * such that the tail of the input list is the new tail of this list and all other
	 * nodes follow in order and the head of the input list is attached as the
	 * next node following the prior tail of this list and vice versa.
	 * The input list is cleared in the process.
	 * @param otherDoublyLinkedList The input list
	 */
	public moveNodesFromDoublyLinkedListToTail(otherDoublyLinkedList: DoublyLinkedList<T>) {
		if (otherDoublyLinkedList.isEmpty()) {
			return;
		}

		const priorTailNode = this.tailNode;

		this.tailNode = otherDoublyLinkedList.tailNode;

		if (priorTailNode === undefined) {
			// this list was empty
			this.headNode = otherDoublyLinkedList.headNode;
		} else {
			otherDoublyLinkedList.headNode!.previousNode = priorTailNode;
			priorTailNode.nextNode = otherDoublyLinkedList.headNode;
		}

		this.numberOfNodes += otherDoublyLinkedList.numberOfNodes;

		otherDoublyLinkedList.clear();
	}

	public peekValueAtHead() {
		return this.headNode?.value;
	}

	public peekValueAtIndex(index: number) {
		if (index < 1) {
			throw `Provided index, ${index}, is less than 1`;
		}

		if (index > this.numberOfNodes) {
			throw `Provided index, ${index}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		for (const [currentIndex, currentNode] of this.getForwardIndexAndNodeTupleIterator()) {
			if (currentIndex === index) {
				return currentNode.value;
			}
		}

		// should never get here
		throw `Somehow failed to find index, ${index}, even though it is in bounds`;
	}

	public peekValueAtTail() {
		return this.tailNode?.value;
	}

	public contains(value: T) {
		for (const currentNode of this.getForwardValuesIterator()) {
			if (currentNode === value) {
				return true;
			}
		}

		return false;
	}

	public popHeadValue() {
		if (this.headNode === undefined) {
			return undefined;
		}

		const oldHeadNode = this.headNode;
		const headValue = oldHeadNode.value;

		if (oldHeadNode === this.tailNode) {
			// the list only had one element
			this.headNode = undefined;
			this.tailNode = undefined;
		} else {
			this.headNode = oldHeadNode.nextNode;
			this.headNode!.previousNode = undefined;
		}

		this.numberOfNodes--;

		return headValue;
	}

	public popTailValue() {
		if (this.tailNode === undefined) {
			return undefined;
		}

		const oldTailNode = this.tailNode;
		const tailValue = oldTailNode.value;

		if (oldTailNode === this.headNode) {
			// the list only had one element
			this.headNode = undefined;
			this.tailNode = undefined;
		} else {
			this.tailNode = oldTailNode.previousNode;
			this.tailNode!.nextNode = undefined;
		}

		this.numberOfNodes--;

		return tailValue;
	}

	public popValueAtIndex(index: number) {
		if (index < 1) {
			throw `Provided index, ${index}, is less than 0`;
		}

		if (index > this.numberOfNodes) {
			throw `Provided index, ${index}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		if (index === 1) {
			// same as popping the head node
			// we know there has to be a head value, so cast is safe
			return this.popHeadValue() as T;
		}

		if (index === this.numberOfNodes) {
			// same as popping the tail node
			// we know there has to be a tail value, so cast is safe
			return this.popTailValue() as T;
		}

		let previousNode: IDoublyLinkedListNode<T> | undefined;
		for (const [currentIndex, currentNode] of this.getForwardIndexAndNodeTupleIterator()) {
			if (currentIndex === index) {
				const value = currentNode.value;

				const nextNode = currentNode.nextNode!; // we aren't popping the tail at this point so this is not undefined

				previousNode!.nextNode = nextNode;
				nextNode.previousNode = previousNode;

				this.numberOfNodes--;

				return value;
			} else {
				previousNode = currentNode;
			}
		}

		// should never get here
		throw `Somehow failed to find index, ${index}, even though it is in bounds`;
	}

	public popValuesToSubList(startIndex: number, endIndex: number): DoublyLinkedList<T> {
		return this.doPopValuesToSubList(startIndex, endIndex, new DoublyLinkedList());
	}

	public pushArrayToHead(valuesArray: readonly T[]) {
		if (valuesArray.isEmpty()) {
			return;
		}

		const priorHeadNode = this.headNode;

		let mostRecentNode: DoublyLinkedListNode<T> | undefined;
		for (const value of valuesArray) {
			const newNode = new DoublyLinkedListNode(value);

			newNode.nextNode = priorHeadNode;

			if (this.headNode === priorHeadNode) {
				// this is the first new node
				this.headNode = newNode;
			}

			if (mostRecentNode !== undefined) {
				mostRecentNode.nextNode = newNode;
				newNode.previousNode = mostRecentNode;
			}

			mostRecentNode = newNode;
		}

		if (this.tailNode === undefined) {
			// the list was empty before this
			this.tailNode = mostRecentNode;
		}

		this.numberOfNodes += valuesArray.size();
	}

	public pushArrayToIndex(index: number, valuesArray: readonly T[]) {
		if (index < 1) {
			throw `Provided index, ${index}, is less than 1`;
		}

		if (index > this.numberOfNodes + 1) {
			throw `Provided index, ${index}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		if (valuesArray.isEmpty()) {
			return;
		}

		if (index === 1) {
			// just the same as pushing to head
			this.pushArrayToHead(valuesArray);
			return;
		}

		if (index === this.numberOfNodes + 1) {
			// just the same as pushing to tail
			this.pushArrayToTail(valuesArray);
			return;
		}

		let previousNode = this.headNode!; // at this point we know this isn't pushing to be the head node and the list is not empty
		for (const [currentIndex, currentNode] of this.getForwardIndexAndNodeTupleIterator()) {
			if (currentIndex === index) {
				for (const value of valuesArray) {
					const newNode = new DoublyLinkedListNode(value);

					previousNode.nextNode = newNode;
					newNode.previousNode = previousNode;
					newNode.nextNode = currentNode;
					currentNode.previousNode = newNode;

					previousNode = newNode;
				}

				this.numberOfNodes += valuesArray.size();

				return;
			} else {
				previousNode = currentNode;
			}
		}

		// should never get here
		throw `Somehow failed to find index, ${index}, even though it is in bounds`;
	}

	public pushArrayToTail(valuesArray: readonly T[]) {
		if (valuesArray.isEmpty()) {
			return;
		}

		for (const value of valuesArray) {
			const newNode = new DoublyLinkedListNode(value);

			if (this.tailNode === undefined) {
				// the list was empty before this
				this.headNode = newNode;
			} else {
				newNode.previousNode = this.tailNode;
				this.tailNode.nextNode = newNode;
			}

			this.tailNode = newNode;
		}

		this.numberOfNodes += valuesArray.size();
	}

	public pushToHead(value: T) {
		const priorHeadNode = this.headNode;

		const newNode = new DoublyLinkedListNode(value);
		newNode.nextNode = priorHeadNode;
		this.headNode = newNode;

		if (priorHeadNode === undefined) {
			// the list was empty
			this.tailNode = newNode;
		} else {
			priorHeadNode.previousNode = newNode;
		}

		this.numberOfNodes++;
	}

	public pushToIndex(index: number, value: T) {
		if (index < 1) {
			throw `Provided index, ${index}, is less than 1`;
		}

		if (index > this.numberOfNodes + 1) {
			throw `Provided index, ${index}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		if (index === 1) {
			// just the same as pushing to head
			this.pushToHead(value);
			return;
		}

		if (index === this.numberOfNodes + 1) {
			// just the same as pushing to tail
			this.pushToTail(value);
			return;
		}

		let previousNode = this.headNode!; // at this point we know this isn't pushing to be the head node
		for (const [currentIndex, currentNode] of this.getForwardIndexAndNodeTupleIterator()) {
			if (currentIndex === index) {
				const newNode = new DoublyLinkedListNode(value);
				previousNode.nextNode = newNode;
				newNode.previousNode = previousNode;
				newNode.nextNode = currentNode;
				currentNode.previousNode = newNode;
				this.numberOfNodes++;

				return;
			} else {
				previousNode = currentNode;
			}
		}

		// should never get here
		throw `Somehow failed to find index, ${index}, even though it is in bounds`;
	}

	public pushToTail(value: T) {
		const priorTailNode = this.tailNode;

		const newNode = new DoublyLinkedListNode(value);
		newNode.previousNode = priorTailNode;
		this.tailNode = newNode;

		if (priorTailNode === undefined) {
			// the list was empty
			this.headNode = newNode;
		} else {
			priorTailNode.nextNode = newNode;
		}

		this.numberOfNodes++;
	}

	public size() {
		return this.numberOfNodes;
	}

	public toArray() {
		const array = new Array<T>(this.numberOfNodes);

		for (const [index, node] of this.getForwardIndexAndNodeTupleIterator()) {
			array[index - 1] = node.value;
		}

		return array;
	}

	protected doCopyValuesToSubList(startIndex: number, endIndex: number, subList: DoublyLinkedList<T>) {
		if (startIndex > endIndex) {
			throw `Provided start index, ${startIndex}, is greater than the end index, ${endIndex}`;
		}

		if (startIndex < 1) {
			throw `Provided start index, ${startIndex}, is less than 1`;
		}

		if (endIndex > this.numberOfNodes) {
			throw `Provided end index, ${endIndex}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		for (const [index, node] of this.getForwardIndexAndNodeTupleIterator()) {
			if (index > endIndex) {
				break;
			}

			if (index >= startIndex) {
				subList.pushToTail(node.value);
			}
		}

		return subList;
	}

	protected doPopValuesToSubList(startIndex: number, endIndex: number, subList: DoublyLinkedList<T>) {
		if (startIndex > endIndex) {
			throw `Provided start index, ${startIndex}, is greater than the end index, ${endIndex}`;
		}

		if (startIndex < 1) {
			throw `Provided start index, ${startIndex}, is less than 1`;
		}

		if (endIndex > this.numberOfNodes) {
			throw `Provided end index, ${endIndex}, is out of range of list with ${this.numberOfNodes} elements`;
		}

		let priorToStartNode: IDoublyLinkedListNode<T> | undefined;
		let afterEndNode: IDoublyLinkedListNode<T> | undefined;

		for (const [index, node] of this.getForwardIndexAndNodeTupleIterator()) {
			if (index > this.numberOfNodes) {
				// this is to protect against problems with circular lists
				break;
			}

			if (index < startIndex) {
				priorToStartNode = node;
			} else if (index === startIndex) {
				subList.headNode = node;
				subList.tailNode = node;
			} else if (index <= endIndex) {
				subList.tailNode = node;
			} else if (index > endIndex) {
				afterEndNode = node;
				break;
			}
		}

		subList.headNode!.previousNode = undefined;
		subList.tailNode!.nextNode = undefined;

		if (priorToStartNode !== undefined) {
			priorToStartNode.nextNode = afterEndNode;
		} else {
			// must have started the sublist at the head
			this.headNode = afterEndNode;
		}

		if (afterEndNode !== undefined) {
			afterEndNode.previousNode = priorToStartNode;
		} else {
			// must have ended the sublist at the tail
			this.tailNode = priorToStartNode;
		}

		const rangeSize = endIndex - startIndex + 1;
		subList.numberOfNodes = rangeSize;
		this.numberOfNodes -= rangeSize;

		return subList;
	}

	protected getForwardIndexAndNodeTupleIterator(): IterableFunction<LuaTuple<[number, IDoublyLinkedListNode<T>]>> {
		let currentNode: IDoublyLinkedListNode<T> | undefined = undefined;
		let currentIndex = 0;

		return (() => {
			const node = currentNode === undefined ? this.headNode : currentNode.nextNode;
			const index = ++currentIndex;

			if (node === undefined) {
				return undefined;
			}

			currentNode = node;

			return [index, node] as LuaTuple<[number, IDoublyLinkedListNode<T>]>;
		}) as IterableFunction<LuaTuple<[number, IDoublyLinkedListNode<T>]>>;
	}

	protected getBackwardIndexAndNodeTupleIterator(): IterableFunction<LuaTuple<[number, IDoublyLinkedListNode<T>]>> {
		let currentNode: IDoublyLinkedListNode<T> | undefined = undefined;
		let currentIndex = this.numberOfNodes + 1;

		return (() => {
			const node = currentNode === undefined ? this.tailNode : currentNode.previousNode;
			const index = --currentIndex;

			if (node === undefined) {
				return undefined;
			}

			currentNode = node;

			return [index, node] as LuaTuple<[number, IDoublyLinkedListNode<T>]>;
		}) as IterableFunction<LuaTuple<[number, IDoublyLinkedListNode<T>]>>;
	}
}
