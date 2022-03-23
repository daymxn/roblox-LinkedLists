import { ILinkedList } from "interfaces/ILinkedList";
import { IReadonlyDoublyLinkedList } from "interfaces/IReadonlyDoublyLinkedList";

export interface IDoublyLinkedList<T extends defined> extends IReadonlyDoublyLinkedList<T>, ILinkedList<T> {
	/**
	 * {@inheritdoc IReadonlyLinkedList.copyValuesToSubList}
	 */
	copyValuesToSubList(startIndex: number, exclusiveEndIndex: number): IDoublyLinkedList<T>;

	/**
	 * {@inheritdoc ILinkedList.popValuesToSubList}
	 */
	popValuesToSubList(startIndex: number, exclusiveEndIndex: number): IDoublyLinkedList<T>;
}
