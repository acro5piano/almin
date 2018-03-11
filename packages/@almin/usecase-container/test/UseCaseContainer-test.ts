import { UseCase, Context } from "almin";
import { UseCaseContainer } from "../src";
import { NopeStore } from "./helper/NopeStore";
import * as assert from "assert";

describe("UseCaseContainer", () => {
    it("should send command to bound useCase", async () => {
        const context = new Context({
            store: new NopeStore()
        });

        class TestCommand {
            type = "TestCommand";
        }

        const executed: TestCommand[] = [];

        class TestUseCase extends UseCase {
            execute(command: TestCommand) {
                executed.push(command);
            }
        }

        const container = UseCaseContainer.create(context).bind(TestCommand, new TestUseCase());
        await container.send(new TestCommand());
        assert.strictEqual(executed.length, 1);
        assert.ok(executed[0] instanceof TestCommand);
    });
    it("should bind multiple command and useCase", async () => {
        const context = new Context({
            store: new NopeStore()
        });

        class TestCommandA {
            type = "TestCommandA";
        }

        class TestCommandB {
            type = "TestCommandB";
        }

        const executed: (TestCommandA | TestCommandB)[] = [];

        class TestUseCaseA extends UseCase {
            execute(command: TestCommandA) {
                executed.push(command);
            }
        }

        class TestUseCaseB extends UseCase {
            execute(command: TestCommandB) {
                executed.push(command);
            }
        }

        const container = UseCaseContainer.create(context)
            .bind(TestCommandA, new TestUseCaseA())
            .bind(TestCommandB, new TestUseCaseB());
        // A =>
        await container.send(new TestCommandA());
        assert.strictEqual(executed.length, 1);
        assert.ok(executed[0] instanceof TestCommandA);
        // B =>
        await container.send(new TestCommandB());
        assert.strictEqual(executed.length, 2);
        assert.ok(executed[1] instanceof TestCommandB);
    });
    it("UseCase instance should be called multiple", async () => {
        const context = new Context({
            store: new NopeStore()
        });

        class TestCommand {
            type = "TestCommand";
        }

        const executed: TestCommand[] = [];

        class TestUseCase extends UseCase {
            execute(command: TestCommand) {
                executed.push(command);
            }
        }

        const container = UseCaseContainer.create(context).bind(TestCommand, new TestUseCase());
        // send
        await container.send(new TestCommand());
        await container.send(new TestCommand());
        await container.send(new TestCommand());
        // 3 executed
        assert.strictEqual(executed.length, 3);
    });

    it("UseCaseFactory receive command which is sent", async () => {
        const context = new Context({
            store: new NopeStore()
        });

        class TestCommand {
            type = "TestCommand";
        }

        const executed: TestCommand[] = [];
        const executedFactory: TestCommand[] = [];

        class TestUseCase extends UseCase {
            execute(command: TestCommand) {
                executed.push(command);
            }
        }

        const createTestUseCase = (command: TestCommand) => {
            executedFactory.push(command);
            return new TestUseCase();
        };

        const container = UseCaseContainer.create(context).bindFactory(TestCommand, createTestUseCase);
        // send TestCommand => createTestUseCase()#execute
        await container.send(new TestCommand());
        assert.strictEqual(executed.length, 1);
        assert.strictEqual(executedFactory.length, 1);
        assert.ok(executedFactory[0] instanceof TestCommand);
    });

    it("can bind and bindFactory both", async () => {
        const context = new Context({
            store: new NopeStore()
        });

        class CommandA {
            type = "CommandA";
        }

        class CommandB {
            type = "CommandB";
        }

        const executed: (CommandA | CommandB)[] = [];

        class TestUseCaseA extends UseCase {
            execute(command: CommandA) {
                executed.push(command);
            }
        }

        class TestUseCaseB extends UseCase {
            execute(command: CommandB) {
                executed.push(command);
            }
        }

        const createTestUseCaseB = (_command: CommandB) => {
            return new TestUseCaseB();
        };

        const container = UseCaseContainer.create(context)
            .bind(CommandA, new TestUseCaseA())
            .bindFactory(CommandB, createTestUseCaseB);
        // send CommandA => execute TestUseCaseA
        await container.send(new CommandA());
        assert.strictEqual(executed.length, 1);
        assert.ok(executed[0] instanceof CommandA);
        // send CommandB => execute createTestUseCaseB()
        await container.send(new CommandB());
        assert.strictEqual(executed.length, 2);
        assert.ok(executed[1] instanceof CommandB);
    });
    context("Limitation case", () => {
        it("could not bind with same Command", () => {
            const context = new Context({
                store: new NopeStore()
            });

            class TestCommand {
                type = "TestCommand";
            }

            const executed: TestCommand[] = [];

            class TestUseCaseA extends UseCase {
                execute(command: TestCommand) {
                    executed.push(command);
                }
            }

            class TestUseCaseB extends UseCase {
                execute(command: TestCommand) {
                    executed.push(command);
                }
            }

            assert.throws(() => {
                UseCaseContainer.create(context)
                    .bind(TestCommand, new TestUseCaseA())
                    .bind(TestCommand, new TestUseCaseB());
            }, /This Command is already bound/);
        });
        it("could not bind with same UseCaseFactory", () => {
            const context = new Context({
                store: new NopeStore()
            });

            class TestCommandA {
                type = "TestCommandA";
            }

            class TestCommandB {
                type = "TestCommandB";
            }

            class TestUseCase extends UseCase {
                execute() {}
            }

            const createTestUseCase = () => new TestUseCase();

            assert.throws(() => {
                UseCaseContainer.create(context)
                    .bindFactory(TestCommandA, createTestUseCase)
                    .bindFactory(TestCommandB, createTestUseCase);
            }, /This UseCaseFactory is already bound/);
        });
    });
});
