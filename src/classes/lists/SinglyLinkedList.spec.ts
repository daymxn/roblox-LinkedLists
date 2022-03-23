/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/// <reference types="@rbxts/testez/globals" />

import { runAcyclicLinkedListTests } from "./reusable-tests/AcyclicLinkedListTests";
import { SinglyLinkedList } from "./SinglyLinkedList";

export = () => {
	runAcyclicLinkedListTests(() => new SinglyLinkedList(), describe, it, expect);
};
