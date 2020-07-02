let id = 0
export const IdGenerator = {
    nextId() {
        return id++
    }
}

export function delay(delay: number): Promise<void> { 
    return new Promise((resolve) => setTimeout(resolve, delay))
}